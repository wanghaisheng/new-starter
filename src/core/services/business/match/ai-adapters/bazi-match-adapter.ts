import type { IMatchStrategy } from './match-ai-adapter';

export class BaziMatchAdapter implements IMatchStrategy {
  matchUsers(user: any, candidates: any[], opts: any): any[] {
    // 示例：仅根据 opts.useBazi 决定是否启用八字匹配
    if (!opts.useBazi || !user.bazi) return candidates;
    return candidates.filter((u: any) => this.baziMatch(user.bazi, u.bazi) > 0);
  }
  private baziMatch(userBazi: string, candidateBazi: string): number {
    // 简化示例：八字完全相同则匹配，否则不匹配
    if (!userBazi || !candidateBazi) return 0;
    return userBazi === candidateBazi ? 1 : 0;
  }

  /** 八字五行全量匹配算法 */
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
}
