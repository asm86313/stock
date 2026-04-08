'use client';

import { createChart, ColorType, CandlestickSeries } from 'lightweight-charts';
import { useEffect, useRef } from 'react';

export default function StockChart() {
  const chartContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // 1. 차트 생성
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#1c1c1c' },
        textColor: '#d1d4dc',
      },
      width: chartContainerRef.current.clientWidth,
      height: 300,
    });

    // 2. 캔들스틱 시리즈 추가 (가장 확실한 최신 방식)
    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#f23645',
      downColor: '#089981',
      borderVisible: false,
      wickUpColor: '#f23645',
      wickDownColor: '#089981',
    });

    // 3. 테스트용 가짜 데이터
    const data = [
      { time: '2026-04-01', open: 70000, high: 71000, low: 69000, close: 70500 },
      { time: '2026-04-02', open: 70500, high: 72000, low: 70000, close: 71500 },
      { time: '2026-04-03', open: 71500, high: 71500, low: 68000, close: 69000 },
    ];

    candlestickSeries.setData(data);

    // 창 크기 조절 대응
    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, []);

  return <div ref={chartContainerRef} className="w-full" />;
}