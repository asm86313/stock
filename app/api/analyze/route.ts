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
            당신은 기관급 분석 역량을 가진 실전 투자 고문입니다.
            대상 종목: '${ticker}' | 기준 날짜: ${currentDate}

            [분석 필수 포함 사항]
            1. **최신 이슈 분석**: ${currentDate} 기준, 해당 종목에 영향을 줄 수 있는 최신 뉴스, 공시, 산업 트렌드(예: 2차전지 업황, 금리 결정, 정부 정책 등)를 종합하여 현재 주가의 '재료'를 분석하세요.
            2. **차트 및 이미지 분석**: 첨부된 이미지가 있다면 평단가와 기술적 지표를 대조하세요.
            
            ---

            ## 🚀 [${ticker}] 실시간 이슈 및 매매 가이드

            ## 📰 1. 최신 뉴스 및 재료 분석
            - **핵심 이슈 요약**: 현재 이 종목을 움직이는 가장 큰 뉴스나 재료를 설명.
            - **호재/악재 판단**: 현재 뜬 이슈가 단기용인지, 장기 추세를 바꿀 동력인지 판단.

            ## 💰 2. 실전 매매 타점 (신규/추가)
            | 구분 | 가격 | 액션 가이드 |
            |:---:|:---:|:---|
            | **공격적 매수** | **[가격]** | 이슈가 강력할 때 따라붙을 수 있는 타점 |
            | **보수적 매수** | **[가격]** | 눌림목을 기다려야 하는 안전한 타점 |
            | **목표 수익가** | **[가격]** | 재료의 소멸을 고려한 현실적인 목표치 |
            | **최종 탈출가** | **[가격]** | 재료가 소멸되거나 지지선 붕괴 시 손절선 |

            ## 📉 3. 보유자 대응 (물타기 vs 홀딩)
            - **보유자 판단**: (예: "뉴스가 강력하니 홀딩" 또는 "재료 소멸 구간이니 물타기 절대 금지")
            - **탈출 시나리오**: 물려있는 분들을 위한 본전/최소 손실 탈출 가격과 시점.

            ## 💡 전문가의 최종 결론
            - **한줄 전략**: "이 종목은 지금 '뉴스'에 사서 '공시'에 팔아야 하는 시점입니다." 등.
            - **위험 요소**: 기술적 분석보다 우선해야 할 실시간 리스크 1가지.

            ---
            ※ ${currentDate} 기준 AI 추론이며, 실제 투자는 본인 책임입니다.
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
        model: 'claude-sonnet-4-6', //claude-sonnet-4-6 claude-haiku-4-5-20251001 claude-3-5-sonnet-latest
        max_tokens: 5000,
        messages: [{ role: 'user', content: messageContent }],
        temperature: 0.2
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


/*

text: `
            당신은 기관 트레이더 수준의 금융 분석 AI입니다.
            분석 대상은 '${ticker}'이며, 현재 날짜는 ${currentDate}입니다.

            당신의 목표는 "실제 투자에 바로 활용 가능한 수준의 가격 전략"을 제시하는 것입니다.

            [분석 원칙 - 반드시 준수]
            - 모호한 표현 금지 (예: "상승 가능성 있음" ❌)
            - 모든 가격은 **구체적인 숫자**로 제시
            - 모든 결론에는 **명확한 근거 포함**
            - 차트 기반 분석을 최우선으로 수행

            ---

            ## 📊 1. 시장 상황 및 포지션 분석 (${currentDate} 기준)
            - ${currentYear}년 현재 ${ticker}의 시장 내 위치 (업종, 테마, 흐름)
            - 최근 주가 흐름: 상승 / 하락 / 횡보 중 명확히 판단
            - 현재 위치: 고점 대비 %, 저점 대비 % 기준으로 설명

            ---

            ## 📉 2. 차트 기술적 분석 (핵심)
            ※ 첨부된 이미지가 있다면 반드시 기반으로 분석

            다음 요소를 반드시 포함:
            - **추세 분석**: 상승추세 / 하락추세 / 박스권
            - **지지선 (Support)**: 최소 2개 가격 제시
            - **저항선 (Resistance)**: 최소 2개 가격 제시
            - **캔들 패턴 분석** (예: 장대양봉, 도지, 엔골핑 등)
            - **거래량 해석** (증가/감소 + 의미)
            - **패턴 분석** (삼각수렴, 헤드앤숄더 등 있으면 명시)

            ---

            ## 💰 3. 가격 전략 (실전용)
            반드시 표 형식 + 숫자 포함

            | 구분 | 가격 | 근거 |
            |:---:|:---:|:---|
            | **매수 추천가 1차** | **[가격]** | 1차 지지선 |
            | **매수 추천가 2차** | **[가격]** | 강한 지지선 |
            | **매도 목표가 1차** | **[가격]** | 단기 저항선 |
            | **매도 목표가 2차** | **[가격]** | 돌파 시 목표 |
            | **손절 라인** | **[가격]** | 추세 붕괴 기준 |

            ---

            ## 📈 4. 시나리오 분석 (매우 중요)
            ### ▶ 상승 시나리오
            - 조건: (예: 특정 저항선 돌파)
            - 목표 가격:
            - 확률: (%로 제시)

            ### ▶ 하락 시나리오
            - 조건:
            - 목표 가격:
            - 확률:

            ---

            ## ⚠️ 5. 리스크 분석
            - 기술적 리스크 (지지선 붕괴 등)
            - 매크로 리스크 (${currentYear} 기준 금리, 경기 등)

            ---

            ## 💡 6. 최종 투자 판단
            - **추천 등급**: 매수 / 보유 / 관망 중 하나만 선택
            - **투자 전략 한줄 요약**: (핵심 전략)
            - **핵심 근거 3가지**:
            1.
            2.
            3.

            ---

            ※ 절대 추상적으로 답하지 말고, 반드시 숫자와 근거 중심으로 작성하라.
            `


*/
