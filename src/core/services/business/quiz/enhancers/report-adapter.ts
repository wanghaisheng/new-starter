// 报告适配器：用于生成和处理 quiz 相关的报告逻辑

export class QuizReportAdapter {
  // 生成测评报告，根据 quiz 类型分支处理
  generateReport(result: any): any {
    const { quizType, data } = result;
    switch (quizType) {
      case 'mbti':
        return this.generateMbtiReport(data);
      case 'tcm':
        return this.generateTcmReport(data);
      case 'bazi':
        return this.generateBaziReport(data);
      default:
        return { message: '暂不支持该类型报告' };
    }
  }

  // MBTI 报告生成
  private generateMbtiReport(data: any): any {
    // 假设 data 结构为 { mbtiType: string, description?: string }
    return {
      type: 'MBTI',
      mbtiType: data.mbtiType,
      summary: `您的 MBTI 类型为 ${data.mbtiType}`,
      description: data.description || '暂无详细描述'
    };
  }

  // 中医体质报告生成
  private generateTcmReport(data: any): any {
    // 假设 data 结构为 { scoreList: Array<{type: string, score: number}>, totalScore: number }
    const mainType = data.scoreList?.reduce((prev, curr) => (curr.score > prev.score ? curr : prev), { type: '', score: 0 });
    return {
      type: 'TCM',
      mainConstitution: mainType?.type || '未知',
      scoreList: data.scoreList,
      analysis: `您的主要体质为：${mainType?.type || '未知'}，总分：${data.totalScore}`
    };
  }

  // 八字命理报告生成
  private generateBaziReport(data: any): any {
    // 假设 data 结构为 { name, birthDate, birthPlace, birthTime, baziResult }
    return {
      type: 'Bazi',
      name: data.name,
      birthDate: data.birthDate,
      birthPlace: data.birthPlace,
      birthTime: data.birthTime,
      baziResult: data.baziResult || '命理分析结果待补充'
    };
  }

  // 格式化报告
  formatReport(report: any): string {
    // 可根据类型自定义格式
    if (!report || !report.type) return JSON.stringify(report);
    switch (report.type) {
      case 'MBTI':
        return `【MBTI 性格报告】\n类型：${report.mbtiType}\n简介：${report.description}`;
      case 'TCM':
        return `【中医体质报告】\n主要体质：${report.mainConstitution}\n分析：${report.analysis}`;
      case 'Bazi':
        return `【八字命理报告】\n姓名：${report.name}\n出生日期：${report.birthDate}\n出生地：${report.birthPlace}\n出生时间：${report.birthTime}\n命理分析：${report.baziResult}`;
      default:
        return JSON.stringify(report);
    }
  }
}