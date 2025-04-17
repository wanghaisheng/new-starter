/**
 * MatchService：负责根据 quiz 结果自动刷新用户标签、触发匹配等
 */
export class MatchService {
  /**
   * quiz 结果联动入口：接收标签和报告，自动刷新用户标签、触发推荐等
   */
  async onQuizResult(userId: string, tags: string[], report: any, userService?: any): Promise<void> {
    // 1. 刷新用户标签
    if (userService && userService.updateUserProfile) {
      await userService.updateUserProfile(userId, { tags });
    }
    // 2. 根据报告内容调整用户画像
    if (userService && userService.updateUserProfile && report) {
      await userService.updateUserProfile(userId, { profile: report });
    }
    // 3. 触发匹配刷新/推荐
    await this.refreshUserMatches(userId);
    // 日志
    console.log(`[MatchService] 用户${userId}标签已更新:`, tags, '报告:', report);
  }

  /**
   * 根据最新标签/画像刷新推荐池
   */
  async refreshUserMatches(userId: string): Promise<void> {
    // TODO: 实现推荐池刷新算法
    // 这里只做演示
    console.log(`[MatchService] 用户${userId} 推荐池已刷新`);
  }

  /**
   * 细化八字（生辰）五行相生相克匹配算法
   * - 男女互补：男天干生女天干、女地支生男地支加权更高
   * - 纳音五行（简化版）：天干地支组合后再比五行生克
   * - 支持权重参数
   */
  baziMatchDetailed(userAProfile: any, userBProfile: any, options?: { genderA?: '男'|'女', genderB?: '男'|'女', weights?: { sheng?: number, ke?: number, same?: number, nayin?: number } }): number {
    const wuxingMap: Record<string, '金'|'木'|'水'|'火'|'土'> = {
      '甲': '木', '乙': '木', '丙': '火', '丁': '火', '戊': '土', '己': '土', '庚': '金', '辛': '金', '壬': '水', '癸': '水',
      '子': '水', '丑': '土', '寅': '木', '卯': '木', '辰': '土', '巳': '火', '午': '火', '未': '土', '申': '金', '酉': '金', '戌': '土', '亥': '水'
    };
    const sheng: Record<'金'|'木'|'水'|'火'|'土', '金'|'木'|'水'|'火'|'土'> = { '木': '火', '火': '土', '土': '金', '金': '水', '水': '木' };
    const ke: Record<'金'|'木'|'水'|'火'|'土', '金'|'木'|'水'|'火'|'土'> = { '木': '土', '土': '水', '水': '火', '火': '金', '金': '木' };
    // 纳音五行（天干地支组合，简化，仅部分）
    const nayinMap: Record<string, '金'|'木'|'水'|'火'|'土'> = {
      '甲子': '金', '乙丑': '金', '丙寅': '火', '丁卯': '火', '戊辰': '土', '己巳': '土',
      '庚午': '金', '辛未': '金', '壬申': '水', '癸酉': '水', '甲戌': '火', '乙亥': '火',
      // ...可补全所有60甲子
    };
    const w = { sheng: 15, ke: -10, same: 8, nayin: 10, ...options?.weights };
    if (!userAProfile?.bazi || !userBProfile?.bazi) return 0;
    const aArr = userAProfile.bazi.split('');
    const bArr = userBProfile.bazi.split('');
    let score = 0;
    // 天干地支各4位，i=0,2,4,6天干，i=1,3,5,7地支
    for (let i = 0; i < 8; i += 2) {
      const aGan = aArr[i], aZhi = aArr[i+1], bGan = bArr[i], bZhi = bArr[i+1];
      const aGanWuxing = wuxingMap[aGan], aZhiWuxing = wuxingMap[aZhi];
      const bGanWuxing = wuxingMap[bGan], bZhiWuxing = wuxingMap[bZhi];
      // 男女互补加权
      if (options?.genderA === '男' && options?.genderB === '女' && sheng[aGanWuxing] === bGanWuxing) score += w.sheng * 1.2;
      else if (options?.genderA === '女' && options?.genderB === '男' && sheng[bGanWuxing] === aGanWuxing) score += w.sheng * 1.2;
      else if (sheng[aGanWuxing] === bGanWuxing) score += w.sheng;
      else if (ke[aGanWuxing] === bGanWuxing) score += w.ke;
      else if (aGanWuxing === bGanWuxing) score += w.same;
      // 地支同理
      if (sheng[aZhiWuxing] === bZhiWuxing) score += w.sheng;
      else if (ke[aZhiWuxing] === bZhiWuxing) score += w.ke;
      else if (aZhiWuxing === bZhiWuxing) score += w.same;
      // 纳音五行加分（简化）
      const aNayin = nayinMap[aGan + aZhi], bNayin = nayinMap[bGan + bZhi];
      if (aNayin && bNayin && sheng[aNayin] === bNayin) score += w.nayin;
      else if (aNayin && bNayin && ke[aNayin] === bNayin) score += w.nayin * 0.5;
    }
    score = Math.max(0, Math.min(100, Math.round(score)));
    return score;
  }

  /**
   * 进一步细化八字匹配算法：
   * - 完整60甲子纳音五行映射
   * - 生肖刑冲合害加权
   */
  baziMatchFull(userAProfile: any, userBProfile: any, options?: { genderA?: '男'|'女', genderB?: '男'|'女', weights?: { sheng?: number, ke?: number, same?: number, nayin?: number, zodiac?: number, sanhe?: number, liuhe?: number } }): number {
    const wuxingMap: Record<string, '金'|'木'|'水'|'火'|'土'> = {
      '甲': '木', '乙': '木', '丙': '火', '丁': '火', '戊': '土', '己': '土', '庚': '金', '辛': '金', '壬': '水', '癸': '水',
      '子': '水', '丑': '土', '寅': '木', '卯': '木', '辰': '土', '巳': '火', '午': '火', '未': '土', '申': '金', '酉': '金', '戌': '土', '亥': '水'
    };
    const sheng: Record<'金'|'木'|'水'|'火'|'土', '金'|'木'|'水'|'火'|'土'> = { '木': '火', '火': '土', '土': '金', '金': '水', '水': '木' };
    const ke: Record<'金'|'木'|'水'|'火'|'土', '金'|'木'|'水'|'火'|'土'> = { '木': '土', '土': '水', '水': '火', '火': '金', '金': '木' };
    // 完整60甲子纳音五行
    const jiaziList = [
      '甲子','乙丑','丙寅','丁卯','戊辰','己巳','庚午','辛未','壬申','癸酉',
      '甲戌','乙亥','丙子','丁丑','戊寅','己卯','庚辰','辛巳','壬午','癸未',
      '甲申','乙酉','丙戌','丁亥','戊子','己丑','庚寅','辛卯','壬辰','癸巳',
      '甲午','乙未','丙申','丁酉','戊戌','己亥','庚子','辛丑','壬寅','癸卯',
      '甲辰','乙巳','丙午','丁未','戊申','己酉','庚戌','辛亥','壬子','癸丑',
      '甲寅','乙卯','丙辰','丁巳','戊午','己未','庚申','辛酉','壬戌','癸亥'
    ];
    const nayinArr: ('金'|'木'|'水'|'火'|'土')[] = [
      '金','金','火','火','土','土','金','金','水','水', // 1-10
      '火','火','水','水','木','木','土','土','火','火', // 11-20
      '金','金','土','土','火','火','木','木','土','土', // 21-30
      '火','火','金','金','土','土','水','水','木','木', // 31-40
      '土','土','火','火','金','金','水','水','木','木', // 41-50
      '土','土','金','金','水','水','火','火','土','土'  // 51-60
    ];
    const nayinMap: Record<string, '金'|'木'|'水'|'火'|'土'> = {};
    for(let i=0; i<60; i++) nayinMap[jiaziList[i]] = nayinArr[i];
    // 生肖刑冲合害完整规则
    // 三合：申子辰合水，巳酉丑合金，寅午戌合火，亥卯未合木
    // 六合：子丑、寅亥、卯戌、辰酉、巳申、午未
    // 三刑：寅巳申、丑戌未、子卯刑
    // 六冲：子午、丑未、寅申、卯酉、辰戌、巳亥
    // 六害：子未、丑午、寅巳、卯辰、申亥、酉戌
    const zodiacList = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
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
    // 评分加权
    const w = { sheng: 15, ke: -10, same: 8, nayin: 10, zodiac: 12, sanhe: 16, liuhe: 14, ...options?.weights };
    if (!userAProfile?.bazi || !userBProfile?.bazi) return 0;
    const aArr = userAProfile.bazi.split('');
    const bArr = userBProfile.bazi.split('');
    let score = 0;
    for (let i = 0; i < 8; i += 2) {
      const aGan = aArr[i], aZhi = aArr[i+1], bGan = bArr[i], bZhi = bArr[i+1];
      const aGanWuxing = wuxingMap[aGan], aZhiWuxing = wuxingMap[aZhi];
      const bGanWuxing = wuxingMap[bGan], bZhiWuxing = wuxingMap[bZhi];
      // 男女互补加权
      if (options?.genderA === '男' && options?.genderB === '女' && sheng[aGanWuxing] === bGanWuxing) score += w.sheng * 1.2;
      else if (options?.genderA === '女' && options?.genderB === '男' && sheng[bGanWuxing] === aGanWuxing) score += w.sheng * 1.2;
      else if (sheng[aGanWuxing] === bGanWuxing) score += w.sheng;
      else if (ke[aGanWuxing] === bGanWuxing) score += w.ke;
      else if (aGanWuxing === bGanWuxing) score += w.same;
      // 地支同理
      if (sheng[aZhiWuxing] === bZhiWuxing) score += w.sheng;
      else if (ke[aZhiWuxing] === bZhiWuxing) score += w.ke;
      else if (aZhiWuxing === bZhiWuxing) score += w.same;
      // 纳音五行加分
      const aNayin = nayinMap[aGan + aZhi], bNayin = nayinMap[bGan + bZhi];
      if (aNayin && bNayin && sheng[aNayin] === bNayin) score += w.nayin;
      else if (aNayin && bNayin && ke[aNayin] === bNayin) score += w.nayin * 0.5;
      // 生肖刑冲合害
      if (zodiacRelation[aZhi] && zodiacRelation[aZhi].chong.includes(bZhi)) score += w.zodiac * -1; // 冲扣分
      if (zodiacRelation[aZhi] && zodiacRelation[aZhi].he.includes(bZhi)) score += w.zodiac * 1.2; // 合加分
      if (zodiacRelation[aZhi] && zodiacRelation[aZhi].hai.includes(bZhi)) score += w.zodiac * -0.5; // 害小扣分
      if (zodiacRelation[aZhi] && zodiacRelation[aZhi].xing.includes(bZhi)) score += w.zodiac * -0.8; // 刑扣分
      if (zodiacRelation[aZhi] && zodiacRelation[aZhi].sanhe.includes(bZhi)) score += w.sanhe; // 三合加分
      if (zodiacRelation[aZhi] && zodiacRelation[aZhi].liuhe.includes(bZhi)) score += w.liuhe; // 六合加分
    }
    score = Math.max(0, Math.min(100, Math.round(score)));
    return score;
  }

  /**
   * MBTI 匹配算法示例
   * @param userAMBTI 用户A MBTI，如 "INTJ"
   * @param userBMBTI 用户B MBTI，如 "ENFP"
   * @returns 匹配分数 0-100
   */
  mbtiMatch(userAMBTI: string, userBMBTI: string): number {
    if (!userAMBTI || !userBMBTI || userAMBTI.length !== 4 || userBMBTI.length !== 4) return 0;
    // MBTI 互补型（如 INTJ-ENFP）为最佳，完全一致次之，其余部分相同
    let score = 0;
    const complementary = { I: 'E', E: 'I', N: 'S', S: 'N', T: 'F', F: 'T', J: 'P', P: 'J' };
    let compCount = 0, sameCount = 0;
    for (let i = 0; i < 4; i++) {
      if (userAMBTI[i] === userBMBTI[i]) sameCount++;
      if (complementary[userAMBTI[i]] === userBMBTI[i]) compCount++;
    }
    if (compCount === 4) score = 100; // 完全互补
    else if (sameCount === 4) score = 90; // 完全一致
    else score = sameCount * 20 + compCount * 15; // 部分一致/互补
    return score;
  }

  // 可扩展更多 match 相关业务方法
}
