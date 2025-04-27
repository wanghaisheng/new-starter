import { User } from '@/core/lib/db/types/user.types';
import { IMatchAIAdapter } from './match-ai-adapter';

/**
 * 默认匹配算法适配器，实现地理、标签、八字、MBTI等多种算法
 */
export class DefaultMatchAIAdapter implements IMatchAIAdapter {
  /** 地理位置筛选 */
  matchByLocation(user: User, candidates: User[], maxDistanceKm: number): User[] {
    if (!user?.location) return [];
    return candidates.filter(u => {
      if (!u.location) return false;
      const dist = this.calcDistance(user.location, u.location);
      return dist <= maxDistanceKm;
    });
  }

  /** 标签/兴趣/MBTI筛选 */
  matchByTags(user: User, candidates: User[], includeTags?: string[], excludeTags?: string[]): User[] {
    let result = candidates;
    if (includeTags && includeTags.length > 0) {
      result = result.filter(u => includeTags.some(tag => (u.interests || []).includes(tag)));
    }
    if (excludeTags && excludeTags.length > 0) {
      result = result.filter(u => !excludeTags.some(tag => (u.interests || []).includes(tag)));
    }
    return result;
  }

  /**
   * 八字五行全量匹配算法
   */
  baziMatchFull(userAProfile: any, userBProfile: any, options?: { genderA?: '男'|'女', genderB?: '男'|'女', weights?: Record<string, number> }): number {
    const wuxingMap: Record<string, '金'|'木'|'水'|'火'|'土'> = {
      '甲': '木', '乙': '木', '丙': '火', '丁': '火', '戊': '土', '己': '土', '庚': '金', '辛': '金', '壬': '水', '癸': '水',
      '子': '水', '丑': '土', '寅': '木', '卯': '木', '辰': '土', '巳': '火', '午': '火', '未': '土', '申': '金', '酉': '金', '戌': '土', '亥': '水'
    };
    const sheng: Record<'金'|'木'|'水'|'火'|'土', '金'|'木'|'水'|'火'|'土'> = { '木': '火', '火': '土', '土': '金', '金': '水', '水': '木' };
    const ke: Record<'金'|'木'|'水'|'火'|'土', '金'|'木'|'水'|'火'|'土'> = { '木': '土', '土': '水', '水': '火', '火': '金', '金': '木' };
    const jiaziList = [
      '甲子','乙丑','丙寅','丁卯','戊辰','己巳','庚午','辛未','壬申','癸酉',
      '甲戌','乙亥','丙子','丁丑','戊寅','己卯','庚辰','辛巳','壬午','癸未',
      '甲申','乙酉','丙戌','丁亥','戊子','己丑','庚寅','辛卯','壬辰','癸巳',
      '甲午','乙未','丙申','丁酉','戊戌','己亥','庚子','辛丑','壬寅','癸卯',
      '甲辰','乙巳','丙午','丁未','戊申','己酉','庚戌','辛亥','壬子','癸丑',
      '甲寅','乙卯','丙辰','丁巳','戊午','己未','庚申','辛酉','壬戌','癸亥'
    ];
    const nayinArr: ('金'|'木'|'水'|'火'|'土')[] = [
      '金','金','火','火','土','土','金','金','水','水',
      '火','火','水','水','木','木','土','土','火','火',
      '金','金','土','土','火','火','木','木','土','土',
      '火','火','金','金','土','土','水','水','木','木',
      '土','土','火','火','金','金','水','水','木','木',
      '土','土','金','金','水','水','火','火','土','土'
    ];
    const nayinMap: Record<string, '金'|'木'|'水'|'火'|'土'> = {};
    for(let i=0; i<60; i++) nayinMap[jiaziList[i]] = nayinArr[i];
    const zodiacRelation: Record<string, {chong: string[], he: string[], hai: string[], xing: string[], sanhe: string[], liuhe: string[]}> = {
      '子': { chong: ['午'], he: ['丑'], hai: ['未'], xing: ['卯'], sanhe: ['申','辰'], liuhe: ['丑'] },
      '丑': { chong: ['未'], he: ['子'], hai: ['午'], xing: ['戌','未'], sanhe: ['巳','酉'], liuhe: ['子'] },
      '寅': { chong: ['申'], he: ['亥'], hai: ['巳'], xing: ['巳','申'], sanhe: ['午','戌'], liuhe: ['亥'] },
      '卯': { chong: ['酉'], he: ['戌'], hai: ['辰'], xing: ['子'], sanhe: ['亥','未'], liuhe: ['戌'] },
      '辰': { chong: ['戌'], he: ['酉'], hai: ['卯'], xing: ['丑'], sanhe: ['申','子'], liuhe: ['酉'] },
      '巳': { chong: ['亥'], he: ['申'], hai: ['寅'], xing: ['寅','申'], sanhe: ['酉','丑'], liuhe: ['申'] },
      '午': { chong: ['子'], he: ['未'], hai: ['丑'], xing: ['酉'], sanhe: ['寅','戌'], liuhe: ['未'] },
      '未': { chong: ['丑'], he: ['午'], hai: ['子'], xing: ['丑','戌'], sanhe: ['卯','亥'], liuhe: ['午'] },
      '申': { chong: ['寅'], he: ['巳'], hai: ['亥'], xing: ['寅','巳'], sanhe: ['子','辰'], liuhe: ['巳'] },
      '酉': { chong: ['卯'], he: ['辰'], hai: ['戌'], xing: ['午'], sanhe: ['巳','丑'], liuhe: ['辰'] },
      '戌': { chong: ['辰'], he: ['卯'], hai: ['酉'], xing: ['丑','未'], sanhe: ['寅','午'], liuhe: ['卯'] },
      '亥': { chong: ['巳'], he: ['寅'], hai: ['申'], xing: ['巳','申'], sanhe: ['卯','未'], liuhe: ['寅'] }
    };
    const w = { sheng: 15, ke: -10, same: 8, nayin: 10, zodiac: 12, sanhe: 16, liuhe: 14, ...options?.weights };
    if (!userAProfile?.bazi || !userBProfile?.bazi) return 0;
    const aArr = userAProfile.bazi.split('');
    const bArr = userBProfile.bazi.split('');
    let score = 0;
    for (let i = 0; i < 8; i += 2) {
      const aGan = aArr[i], aZhi = aArr[i+1], bGan = bArr[i], bZhi = bArr[i+1];
      const aGanWuxing = wuxingMap[aGan], aZhiWuxing = wuxingMap[aZhi];
      const bGanWuxing = wuxingMap[bGan], bZhiWuxing = wuxingMap[bZhi];
      if (options?.genderA === '男' && options?.genderB === '女' && sheng[aGanWuxing] === bGanWuxing) score += w.sheng * 1.2;
      else if (options?.genderA === '女' && options?.genderB === '男' && sheng[bGanWuxing] === aGanWuxing) score += w.sheng * 1.2;
      else if (sheng[aGanWuxing] === bGanWuxing) score += w.sheng;
      else if (ke[aGanWuxing] === bGanWuxing) score += w.ke;
      else if (aGanWuxing === bGanWuxing) score += w.same;
      if (sheng[aZhiWuxing] === bZhiWuxing) score += w.sheng;
      else if (ke[aZhiWuxing] === bZhiWuxing) score += w.ke;
      else if (aZhiWuxing === bZhiWuxing) score += w.same;
      if (nayinMap[aGan + aZhi] && nayinMap[aGan + aZhi] === nayinMap[bGan + bZhi]) score += w.nayin;
      if (zodiacRelation[aZhi]?.sanhe.includes(bZhi)) score += w.sanhe;
      if (zodiacRelation[aZhi]?.liuhe.includes(bZhi)) score += w.liuhe;
    }
    return score;
  }

  /**
   * 八字五行简化匹配算法
   */
  baziMatchDetailed(userAProfile: any, userBProfile: any, options?: { weights?: Record<string, number> }): number {
    const wuxingMap: Record<string, '金'|'木'|'水'|'火'|'土'> = {
      '甲': '木', '乙': '木', '丙': '火', '丁': '火', '戊': '土', '己': '土', '庚': '金', '辛': '金', '壬': '水', '癸': '水',
      '子': '水', '丑': '土', '寅': '木', '卯': '木', '辰': '土', '巳': '火', '午': '火', '未': '土', '申': '金', '酉': '金', '戌': '土', '亥': '水'
    };
    const sheng: Record<'金'|'木'|'水'|'火'|'土', '金'|'木'|'水'|'火'|'土'> = { '木': '火', '火': '土', '土': '金', '金': '水', '水': '木' };
    const ke: Record<'金'|'木'|'水'|'火'|'土', '金'|'木'|'水'|'火'|'土'> = { '木': '土', '土': '水', '水': '火', '火': '金', '金': '木' };
    const w = { sheng: 10, ke: -8, same: 6, ...options?.weights };
    if (!userAProfile?.bazi || !userBProfile?.bazi) return 0;
    // 只取年柱和日柱（前4位和后4位）
    const aArr = userAProfile.bazi.split('');
    const bArr = userBProfile.bazi.split('');
    let score = 0;
    // 年柱
    const aYearGan = aArr[0], aYearZhi = aArr[1], bYearGan = bArr[0], bYearZhi = bArr[1];
    const aYearWuxing = wuxingMap[aYearGan], bYearWuxing = wuxingMap[bYearGan];
    if (sheng[aYearWuxing] === bYearWuxing) score += w.sheng;
    else if (ke[aYearWuxing] === bYearWuxing) score += w.ke;
    else if (aYearWuxing === bYearWuxing) score += w.same;
    // 日柱
    const aDayGan = aArr[4], aDayZhi = aArr[5], bDayGan = bArr[4], bDayZhi = bArr[5];
    const aDayWuxing = wuxingMap[aDayGan], bDayWuxing = wuxingMap[bDayGan];
    if (sheng[aDayWuxing] === bDayWuxing) score += w.sheng;
    else if (ke[aDayWuxing] === bDayWuxing) score += w.ke;
    else if (aDayWuxing === bDayWuxing) score += w.same;
    return score;
  }

  /** 手机品牌筛选/加分 */
  matchByPhoneBrand(user: User, candidates: User[], targetBrands?: string[]): User[] {
    if (!targetBrands || targetBrands.length === 0) return candidates;
    return candidates.filter(u => u.phoneBrand && targetBrands.includes(u.phoneBrand));
  }

  /** 城市地理位置筛选 */
  matchByCity(user: User, candidates: User[], targetCities?: string[]): User[] {
    if (!targetCities || targetCities.length === 0) return candidates;
    return candidates.filter(u => u.city && targetCities.includes(u.city));
  }

  /** MBTI 匹配评分算法 */
  mbtiMatch(typeA?: string, typeB?: string): number {
    if (!typeA || !typeB || typeA.length !== 4 || typeB.length !== 4) return 0;
    let score = 0;
    for (let i = 0; i < 4; i++) {
      if (typeA[i] === typeB[i]) score += 3; // 完全一致加分
      else {
        // 互补型加分（如 E/I、N/S、T/F、J/P）
        if ((i === 0 && ((typeA[i] === 'E' && typeB[i] === 'I') || (typeA[i] === 'I' && typeB[i] === 'E')))
          || (i === 1 && ((typeA[i] === 'N' && typeB[i] === 'S') || (typeA[i] === 'S' && typeB[i] === 'N')))
          || (i === 2 && ((typeA[i] === 'T' && typeB[i] === 'F') || (typeA[i] === 'F' && typeB[i] === 'T')))
          || (i === 3 && ((typeA[i] === 'J' && typeB[i] === 'P') || (typeA[i] === 'P' && typeB[i] === 'J')))) {
          score += 2; // 互补型加分
        }
      }
    }
    return score;
  }

  /** 计算两地距离（单位：km） */
  private calcDistance(locA: any, locB: any): number {
    if (!locA || !locB) return Infinity;
    const toRad = (d: number) => (d * Math.PI) / 180;
    const R = 6371;
    const dLat = toRad(locB.latitude - locA.latitude);
    const dLon = toRad(locB.longitude - locA.longitude);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(locA.latitude)) *
        Math.cos(toRad(locB.latitude)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /** 随机匹配（兜底） */
  matchRandom(candidates: User[], limit?: number): User[] {
    const arr = candidates.slice();
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    if (limit && limit > 0) {
      return arr.slice(0, limit);
    }
    return arr;
  }

  /**
   * 综合多机制智能匹配
   * 支持位置、兴趣、mbti、八字、随机等任意组合
   */
  matchUsers(user: User, candidates: User[], opts: {
    maxDistanceKm?: number;
    includeTags?: string[];
    excludeTags?: string[];
    useRandom?: boolean;
    useBazi?: boolean;
    useMBTI?: boolean;
    mbtiType?: string;
    limit?: number;
    phoneBrands?: string[];
    cities?: string[];
  }): User[] {
    let pool = candidates;
    // 手机品牌筛选
    if (opts.phoneBrands && opts.phoneBrands.length > 0) {
      pool = this.matchByPhoneBrand(user, pool, opts.phoneBrands);
    }
    // 城市筛选
    if (opts.cities && opts.cities.length > 0) {
      pool = this.matchByCity(user, pool, opts.cities);
    }
    // 随机优先（如指定 useRandom）
    if (opts.useRandom) {
      return this.matchRandom(pool, opts.limit);
    }
    // 位置筛选
    if (opts.maxDistanceKm && user && user.location) {
      pool = this.matchByLocation(user, pool, opts.maxDistanceKm);
    }
    // 标签/兴趣筛选
    if ((opts.includeTags && opts.includeTags.length > 0) || (opts.excludeTags && opts.excludeTags.length > 0)) {
      pool = this.matchByTags(user, pool, opts.includeTags, opts.excludeTags);
    }
    // MBTI筛选/加分
    if (opts.useMBTI && opts.mbtiType) {
      pool = pool
        .map(u => {
          const score = this.mbtiMatch(opts.mbtiType!, u.mbti);
          return { user: u, mbtiScore: score };
        })
        .sort((a, b) => b.mbtiScore - a.mbtiScore)
        .map(item => item.user);
    }
    // 八字命理加分
    if (opts.useBazi && user && user.bazi) {
      pool = pool
        .map(u => {
          if (u.bazi) {
            const score = this.baziMatchFull(user, u);
            return { user: u, baziScore: score };
          } else {
            return { user: u, baziScore: 0 };
          }
        })
        .sort((a, b) => b.baziScore - a.baziScore)
        .map(item => item.user);
    }
    // 若全部条件都没有，随机推荐
    const noLocation = !(opts.maxDistanceKm && opts.maxDistanceKm > 0);
    const noIncludeTags = !(opts.includeTags && opts.includeTags.length > 0);
    const noExcludeTags = !(opts.excludeTags && opts.excludeTags.length > 0);
    const noBazi = !opts.useBazi;
    const noMBTI = !opts.useMBTI;
    const noPhoneBrands = !(opts.phoneBrands && opts.phoneBrands.length > 0);
    const noCities = !(opts.cities && opts.cities.length > 0);
    if (noLocation && noIncludeTags && noExcludeTags && noBazi && noMBTI && noPhoneBrands && noCities) {
      pool = this.matchRandom(pool, opts.limit);
      return pool;
    }
    if (opts.limit && opts.limit > 0) {
      pool = pool.slice(0, opts.limit);
    }
    return pool;
  }
}
