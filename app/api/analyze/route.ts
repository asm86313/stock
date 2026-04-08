import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    // 1. 클라이언트에서 ticker와 이미지(base64) 데이터를 받습니다.
    const { ticker, imageBase64 } = await req.json();

    const now = new Date();
    const currentDate = now.toISOString().split('T')[0];
    const currentYear = now.getFullYear();

    // 2. 메시지 내용 구성 (텍스트와 이미지를 배열로 담습니다)
    const messageContent: any[] = [
      {
        type: 'text',
        text: `
          당신은 실시간 금융 데이터 및 기술적 분석가입니다. 
          분석 대상은 '${ticker}'이며, 현재 시점은 ${currentDate}입니다.

          [분석 지시사항]
          1. 시점 인지: 오늘은 ${currentDate}입니다. ${currentYear}년 상반기 흐름을 반영하세요.
          2. 차트 분석: 첨부된 차트 이미지가 있다면 캔들 패턴, 지지/저항선, 추세를 상세히 분석하세요.
          3. 실시간 추론: ${ticker}의 최신 업황과 차트의 기술적 지표를 결합하여 분석하세요.
          4. 가격 전략: 차트 분석 결과를 바탕으로 구체적인 '매수 추천가', '매도 목표가'를 숫자로 제시하세요.

          **답변 형식 (Markdown 사용):**

          ## 📊 현황 및 차트 요약 (${currentDate} 기준)
          - **현재 시장 위치**: ${currentYear}년 업종 내 위상 및 주가 흐름.
          - **차트 분석 결과**: 첨부된 이미지에서 보이는 기술적 특징(추세, 패턴 등) 요약.

          ## 💰 가격 전략 (Price Strategy)
          | 구분 | 추천 가격 | 근거 |
          |:---:|:---:|:---|
          | **매수 추천가** | **[금액 제시]** | 차트상 지지선 및 저평가 구간 |
          | **매도 목표가** | **[금액 제시]** | 차트상 저항선 및 목표가 |
          | **손절 라인** | **[금액 제시]** | 주요 이탈 시 리스크 관리 가격 |

          ## ⚠️ 위험 요소
          - **기술적 리스크**: 차트상 우려되는 패턴이나 지지선 이탈 가능성.
          - **매크로 리스크**: ${currentYear}년 글로벌 경기 및 업황 리스크.

          ## 💡 투자 의견
          - **추천 등급**: (매수 / 보유 / 관망 중 택 1)
          - **핵심 투자 포인트**: 차트와 펀더멘탈을 결합한 3가지 핵심 이유.

          ---
          *주의: 본 리포트는 차트 이미지와 AI 추론을 결합한 데이터이며, 실제 투자는 본인 책임입니다.*
        `
      }
    ];

    // 3. 이미지가 있다면 메시지에 추가 (중요)
    if (imageBase64) {
      messageContent.push({
        type: 'image',
        source: {
          type: 'base64',
          media_type: 'image/png', // 또는 이미지 형식에 맞게 조절
          data: imageBase64,
        },
      });
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001', //claude-sonnet-4-6 claude-haiku-4-5-20251001
        max_tokens: 2000,
        messages: [{ role: 'user', content: messageContent }],
      }),
    });

// --- 에러 분석을 위한 로그 추가 구간 ---
    const data = await response.json();

    console.log("=== [Claude API 응답 상세 로그] ===");
    console.log(JSON.stringify(data, null, 2)); 
    // 터미널(VS Code 하단)에 에러 메시지가 아주 상세히 찍히게 됩니다.
    // ---------------------------------------

    if (data.error) {
      // 앤스로픽 서버가 보낸 구체적인 에러 메시지를 클라이언트로 전달
      console.error("Claude API 에러 유형:", data.error.type);
      console.error("Claude API 에러 메시지:", data.error.message);
      return NextResponse.json({
        error: `Claude 에러: ${data.error.message} (유형: ${data.error.type})` 
      }, { status: 400 });
    }

    if (!data.content || data.content.length === 0) {
      throw new Error('응답 데이터에 content가 비어 있습니다.');
    }

    return NextResponse.json({ result: data.content[0].text });
  } catch (error: any) {
    console.error("서버 내부 에러 발생:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}