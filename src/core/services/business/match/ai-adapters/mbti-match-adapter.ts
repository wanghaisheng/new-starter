import type { IMatchStrategy } from './match-ai-adapter';

export class MBTIMatchAdapter implements IMatchStrategy {
  matchUsers(user: any, candidates: any[], opts: any): any[] {
    if (!opts.useMBTI || !user.mbti) return candidates;
    return candidates.filter((u: any) => this.mbtiMatch(user.mbti, u.mbti) > 0);
  }

  /** MBTI 匹配评分算法 */
  private mbtiMatch(typeA?: string, typeB?: string): number {
    if (!typeA || !typeB || typeA.length !== 4 || typeB.length !== 4) return 0;
    let score = 0;
    for (let i = 0; i < 4; i++) {
      if (typeA[i] === typeB[i]) score += 3; // 完全一致加分
      else {
        // 互补型加分
        if ((i === 0 && ((typeA[i] === 'E' && typeB[i] === 'I') || (typeA[i] === 'I' && typeB[i] === 'E')))
          || (i === 1 && ((typeA[i] === 'N' && typeB[i] === 'S') || (typeA[i] === 'S' && typeB[i] === 'N')))
          || (i === 2 && ((typeA[i] === 'T' && typeB[i] === 'F') || (typeA[i] === 'F' && typeB[i] === 'T')))
          || (i === 3 && ((typeA[i] === 'J' && typeB[i] === 'P') || (typeA[i] === 'P' && typeB[i] === 'J')))) {
          score += 2;
        }
      }
    }
    return score;
  }
}
