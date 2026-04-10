'use client';

import { useState, useRef } from 'react';
import { Search, BrainCircuit, Sparkles, Loader2, ImageIcon, X } from 'lucide-react';
import dynamic from 'next/dynamic';

const StockChart = dynamic(() => import('../components/StockChart'), {
  ssr: false,
  loading: () => <div className="h-[300px] bg-[#1c1c1c] animate-pulse rounded-3xl" />
});

export default function Home() {
  const [ticker, setTicker] = useState('');
  const [analysis, setAnalysis] = useState('');
  const [loading, setLoading] = useState(false);

  // 이미지 관련 상태
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. 이미지를 Base64로 변환하는 함수
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64String = (reader.result as string).split(',')[1];
        resolve(base64String);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  // 2. 이미지 선택 핸들러
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  // 3. 분석 시작 함수
  const handleAnalyze = async () => {
    if (!ticker) return alert("종목명이나 코드를 입력해주세요.");

    setLoading(true);
    setAnalysis('');

    try {
      let imageBase64 = '';
      if (selectedImage) {
        imageBase64 = await fileToBase64(selectedImage);
      }

      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ticker: ticker,
          imageBase64: imageBase64 // 이미지 전송
        })
      });

      const data = await res.json();

      if (data.result) {
        setAnalysis(data.result);
      } else {
        alert(data.error || "분석 결과를 가져오지 못했습니다.");
      }
    } catch (error) {
      console.error("분석 중 에러:", error);
      alert("서버와 통신 중 에러가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#111] text-white p-4 font-sans">
      {/* 검색바 */}
      <div className="relative mb-6">
        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          className="w-full bg-[#222] border-none rounded-2xl py-4 pl-12 pr-4 text-lg outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="종목 이름 입력 (예: 삼성전자)"
          value={ticker}
          onChange={(e) => setTicker(e.target.value)}
        //   onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
        />
      </div>

      {/* 차트 영역 */}
      <div className="bg-[#1c1c1c] rounded-3xl p-4 mb-6 border border-[#2a2a2a]">
        <StockChart />
      </div>

      {/* AI 분석 영역 */}
      <div className="bg-[#1c1c1c] rounded-3xl p-6 border border-[#2a2a2a]">
        <div className="flex flex-col gap-4 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BrainCircuit className="h-6 w-6 text-blue-400" />
              <h2 className="text-xl font-bold">AI 투자 분석</h2>
            </div>

            <div className="flex gap-2">
              {/* 이미지 추가 버튼 */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 bg-[#333] hover:bg-[#444] px-4 py-2.5 rounded-xl font-medium transition-all"
              >
                <ImageIcon className="h-4 w-4 text-gray-300" />
                차트 첨부
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageChange}
                accept="image/*"
                className="hidden"
              />

              {/* 분석 시작 버튼 */}
              <button
                onClick={handleAnalyze}
                disabled={loading}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 px-5 py-2.5 rounded-xl font-bold transition-all"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {loading ? '분석 중...' : 'AI 분석 시작'}
              </button>
            </div>
          </div>

          {/* 이미지 미리보기 창 */}
          {imagePreview && (
            <div className="relative w-full h-40 bg-[#222] rounded-2xl overflow-hidden border border-[#333]">
              <img src={imagePreview} alt="Preview" className="w-full h-full object-contain" />
              <button
                onClick={() => { setSelectedImage(null); setImagePreview(null); }}
                className="absolute top-2 right-2 bg-red-500 p-1 rounded-full hover:bg-red-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {/* 결과창 */}
        {analysis ? (
          <div className="bg-[#262626] p-5 rounded-2xl border border-[#333] whitespace-pre-wrap text-gray-200 leading-relaxed shadow-inner">
            {analysis}
          </div>
        ) : (
          <p className="text-gray-500 text-sm text-center py-10">
            종목과 차트를 첨부하면 더 정확한 기술적 분석이 가능합니다.
          </p>
        )}
      </div>
    </main>
  );
}