import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI, Part } from '@google/generative-ai';

export const dynamic = 'force-dynamic';

// 2. 뉴스 수집 함수
async function getNaverNews(query: string) {
  try {
    const res = await fetch(
      `https://openapi.naver.com/v1/search/news.json?query=${encodeURIComponent(query)}&display=10&sort=sim`,
      {
        headers: {
          'X-Naver-Client-Id': process.env.NAVER_CLIENT_ID || '',
          'X-Naver-Client-Secret': process.env.NAVER_CLIENT_SECRET || '',
        },
        cache: 'no-store'
      }
    );
    const data = await res.json();
    return data.items ? data.items.map((item: any) => `- ${item.title.replace(/<[^>]*>?/gm, '')}`).join('\n') : "뉴스가 없습니다.";
  } catch (e) { return "데이터 연동 실패"; }
}

export async function POST(req: Request) {
  try {
    const { ticker, imageBase64, aiModel } = await req.json();
    const useGemini = aiModel === 'gemini';
    const now = new Date();
    const currentDate = now.toISOString().split('T')[0];

    // 실시간 뉴스 데이터 수집
    const realNews = await getNaverNews(ticker);

        const prompt = `
          당신은 모든 산업 섹터(IT, 바이오, 2차전지, 금융 등)를 아우르는 글로벌 전략가입니다.
          분석 대상: '${ticker}' | 오늘 날짜: ${currentDate}

          [수집된 실시간 뉴스]
          ${realNews}

          [분석 원칙]
          1. **섹터 맞춤 분석**: '${ticker}'가 속한 산업군(반도체라면 사이클, 바이오라면 임상 등)의 핵심 지표를 반영하세요.
          2. **시나리오 세분화**: 단순히 오르고 내리는 것이 아니라, 특정 조건(매크로 지표, 실적 등)에 따른 시나리오를 제시하세요.
          3. **보유자 맞춤형**: 물려있는 비중과 평단가를 고려한 현실적인 탈출 및 물타기 전략을 짜세요.

          ---

          ## 🚀 [${ticker}] 섹터별 핵심 이슈 & 대응 시나리오

          ## 📰 1. 실시간 재료 분석 (News & Issue)
          - **주요 모멘텀**: 현재 주가를 견인하거나 억누르는 핵심 뉴스 분석.
          - **산업 섹터 흐름**: '${ticker}'가 속한 업종 전체의 분위기와 비교 분석.

          ## 💰 2. 실전 매매 타점
          | 구분 | 가격 | 액션 가이드 |
          |:---:|:---:|:---|
          | **적극 진입가** | **[가격]** | 기술적 지지선 및 호재 반영 시점 |
          | **추가 매수(물타기)** | **[가격]** | 평단가를 낮출 수 있는 최후의 보루 |
          | **목표 수익가** | **[가격]** | 저항선 및 고점 매물대 분석 |
          | **손절/비중축소** | **[가격]** | 추세 이탈 시 리스크 관리 가격 |

          ## 📈 3. 향후 주가 시나리오 (Scenario Analysis)
          - **시나리오 A (낙관)**: 특정 호재(실적, 수주 등) 발생 시 도달 가능 가격과 조건.
          - **시나리오 B (비관)**: 매크로 악화(금리, 정책 등) 시 하락 지지선 및 대응법.

          ## 📉 4. 현재 보유자 생존 전략
          - **평단 대비 대응**: (이미지상 평단가와 현재가의 괴리율 분석)
          - **물타기 점수**: 10점 만점 중 몇 점인지와 그 이유.
          - **최종 행동 지침**: "지금은 버티세요" 혹은 "반등 시 무조건 비중 줄이세요" 등.

          ## 💡 전문가의 한 줄 평
          - "**이 종목의 운명은 [무엇]에 달려 있습니다.**"

          ---
          ※ ${currentDate} 실시간 데이터 기반 분석이며, 투자의 최종 책임은 본인에게 있습니다.
        `;

            let resultText = '';

    if (useGemini) {
      // ── Gemini 분기 ──
      const parts: Part[] = [{ text: prompt }];
      if (imageBase64) {
        parts.push({ inlineData: { mimeType: 'image/png', data: imageBase64 } });
      }

      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
      const model = genAI.getGenerativeModel({
        model: 'gemini-2.5-flash', // gemini-2.5-flash, gemini-2.5-pro, gemini-2.0-flash
        generationConfig: { temperature: 0.2, maxOutputTokens: 6000 },
      });

      console.log('=== [Gemini API 요청 시작] ===');
      const geminiResult = await model.generateContent(parts);
      resultText = geminiResult.response.text();
      console.log('=== [Gemini API 응답 완료] ===');

      if (!resultText) throw new Error('Gemini 응답 데이터가 비어 있습니다.');

    } else {
      // ── Claude 분기 ──
      const userContent: Anthropic.MessageParam['content'] = [];
      if (imageBase64) {
        userContent.push({
          type: 'image',
          source: { type: 'base64', media_type: 'image/png', data: imageBase64 },
        });
      }
      userContent.push({ type: 'text', text: prompt });

      const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

      console.log('=== [Claude API 요청 시작] ===');
      const message = await client.messages.create({
        model: 'claude-sonnet-4-5', // claude-opus-4-5, claude-sonnet-4-5, claude-haiku-4-5
        max_tokens: 6000,
        temperature: 0.2,
        messages: [{ role: 'user', content: userContent }],
      });
      resultText = message.content
        .filter((b) => b.type === 'text')
        .map((b) => (b as Anthropic.TextBlock).text)
        .join('');
      console.log('=== [Claude API 응답 완료] ===');

      if (!resultText) throw new Error('Claude 응답 데이터가 비어 있습니다.');
    }

    return NextResponse.json({ result: resultText });
  } catch (error: any) {
    console.error("서버 내부 에러 발생:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
