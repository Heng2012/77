/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Search, 
  FileText, 
  Video, 
  Image as ImageIcon, 
  FileCode, 
  Globe, 
  Loader2, 
  ExternalLink,
  Shield,
  Zap,
  Filter,
  ChevronRight,
  Copy,
  Check,
  ChevronLeft,
  Calendar,
  Users,
  HardDrive,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { searchTelegramResources, SearchFilters } from './services/geminiService';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type ResourceType = 'all' | 'file' | 'video' | 'image' | 'pdf' | 'group';

interface SearchCategory {
  id: ResourceType;
  labelEn: string;
  labelCn: string;
  icon: React.ReactNode;
  color: string;
}

const CATEGORIES: SearchCategory[] = [
  { id: 'all', labelEn: 'All', labelCn: '全部', icon: <Globe className="w-4 h-4" />, color: 'bg-blue-500' },
  { id: 'file', labelEn: 'Files', labelCn: '文件', icon: <FileCode className="w-4 h-4" />, color: 'bg-emerald-500' },
  { id: 'video', labelEn: 'Videos', labelCn: '视频', icon: <Video className="w-4 h-4" />, color: 'bg-purple-500' },
  { id: 'image', labelEn: 'Images', labelCn: '图片', icon: <ImageIcon className="w-4 h-4" />, color: 'bg-pink-500' },
  { id: 'pdf', labelEn: 'PDFs', labelCn: 'PDF文档', icon: <FileText className="w-4 h-4" />, color: 'bg-orange-500' },
];

const ERROR_MESSAGES: Record<string, { en: string; cn: string }> = {
  API_KEY_MISSING: {
    en: "Gemini API key is missing. Please configure it in your environment.",
    cn: "缺少 Gemini API 密钥。请在环境中进行配置。"
  },
  API_KEY_INVALID: {
    en: "The provided API key is invalid or unauthorized.",
    cn: "提供的 API 密钥无效或未授权。"
  },
  NETWORK_ERROR: {
    en: "Network error. Please check your internet connection.",
    cn: "网络错误。请检查您的互联网连接。"
  },
  QUOTA_EXCEEDED: {
    en: "API quota exceeded. Please try again later.",
    cn: "API 配额已超出。请稍后再试。"
  },
  UNKNOWN_ERROR: {
    en: "An unexpected error occurred. Please try again.",
    cn: "发生了意外错误。请重试。"
  }
};

const CopyButton = ({ text }: { text: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors text-[10px] font-medium border border-zinc-700 ml-2 align-middle"
      title="Copy link"
    >
      {copied ? (
        <>
          <Check className="w-3 h-3 text-emerald-400" />
          <span>Copied / 已复制</span>
        </>
      ) : (
        <>
          <Copy className="w-3 h-3" />
          <span>Copy Link / 复制链接</span>
        </>
      )}
    </button>
  );
};

export default function App() {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<ResourceType>('all');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<string | null>(null);
  const [error, setError] = useState<{ en: string; cn: string } | null>(null);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  
  // New Filters
  const [minSize, setMinSize] = useState('');
  const [dateRange, setDateRange] = useState('');
  const [minMembers, setMinMembers] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);

  const handleSearch = async (e?: React.FormEvent, page: number = 1) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    setError(null);
    if (page === 1) setResults(null);
    setCurrentPage(page);

    const filters: SearchFilters = {
      minSize: minSize || undefined,
      dateRange: dateRange || undefined,
      minMembers: minMembers || undefined,
    };

    try {
      const response = await searchTelegramResources(
        query, 
        activeCategory === 'all' ? 'any resources' : activeCategory,
        filters,
        page
      );
      setResults(response);
      
      if (page === 1) {
        setRecentSearches(prev => {
          const filtered = prev.filter(s => s !== query);
          return [query, ...filtered].slice(0, 5);
        });
      }
      
      // Scroll to results
      if (page > 1) {
        window.scrollTo({ top: 400, behavior: 'smooth' });
      }
    } catch (err: any) {
      const errCode = err.message || "UNKNOWN_ERROR";
      setError(ERROR_MESSAGES[errCode] || ERROR_MESSAGES.UNKNOWN_ERROR);
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleNextPage = () => {
    handleSearch(undefined, currentPage + 1);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      handleSearch(undefined, currentPage - 1);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-zinc-100 font-sans selection:bg-blue-500/30">
      {/* Background Glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-purple-500/10 blur-[120px] rounded-full" />
      </div>

      <div className="relative max-w-5xl mx-auto px-6 py-12">
        {/* Header */}
        <header className="mb-12 text-center">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium mb-6"
          >
            <Zap className="w-3 h-3 fill-current" />
            <span>Next-Gen Telegram Search Engine / 下一代 Telegram 搜索引擎</span>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-5xl md:text-6xl font-bold tracking-tight mb-4 bg-gradient-to-b from-white to-zinc-500 bg-clip-text text-transparent"
          >
            TeleSearch Pro
          </motion.h1>
          <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
            Find files, videos, images, and PDFs across the Telegram ecosystem with ultra-fast AI-powered discovery.
            <br />
            在 Telegram 生态系统中通过超快速 AI 驱动的发现功能查找文件、视频、图片和 PDF。
          </p>
        </header>

        {/* Search Section */}
        <section className="mb-12">
          <form onSubmit={(e) => handleSearch(e)} className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl blur opacity-20 group-focus-within:opacity-40 transition duration-500" />
            <div className="relative flex items-center bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl">
              <div className="pl-6 text-zinc-500">
                <Search className="w-6 h-6" />
              </div>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search for movies, books, software... / 搜索电影、书籍、软件..."
                className="w-full bg-transparent border-none focus:ring-0 py-6 px-4 text-xl placeholder:text-zinc-600 outline-none"
              />
              <div className="flex items-center gap-2 mr-2">
                <button
                  type="button"
                  onClick={() => setShowFilters(!showFilters)}
                  className={cn(
                    "p-4 rounded-xl transition-colors flex items-center gap-2",
                    showFilters ? "bg-zinc-800 text-white" : "text-zinc-500 hover:bg-zinc-800"
                  )}
                  title="Filters / 筛选"
                >
                  <Filter className="w-5 h-5" />
                </button>
                <button
                  type="submit"
                  disabled={isSearching}
                  className="px-8 py-4 bg-white text-black font-semibold rounded-xl hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isSearching ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Searching... / 搜索中...</span>
                    </>
                  ) : (
                    <span>Search / 搜索</span>
                  )}
                </button>
              </div>
            </div>
          </form>

          {/* Advanced Filters */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 p-6 bg-zinc-900/50 border border-zinc-800 rounded-2xl">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-zinc-500 uppercase flex items-center gap-2">
                      <HardDrive className="w-3 h-3" />
                      Min File Size / 最小文件大小
                    </label>
                    <select 
                      value={minSize} 
                      onChange={(e) => setMinSize(e.target.value)}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2 text-sm outline-none focus:border-blue-500 transition-colors"
                    >
                      <option value="">Any Size / 任意大小</option>
                      <option value="100MB">100MB+</option>
                      <option value="500MB">500MB+</option>
                      <option value="1GB">1GB+</option>
                      <option value="2GB">2GB+</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-zinc-500 uppercase flex items-center gap-2">
                      <Calendar className="w-3 h-3" />
                      Upload Date / 上传日期
                    </label>
                    <select 
                      value={dateRange} 
                      onChange={(e) => setDateRange(e.target.value)}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2 text-sm outline-none focus:border-blue-500 transition-colors"
                    >
                      <option value="">Any Time / 任意时间</option>
                      <option value="24 hours">Last 24 Hours / 过去24小时</option>
                      <option value="week">Last Week / 过去一周</option>
                      <option value="month">Last Month / 过去一月</option>
                      <option value="year">Last Year / 过去一年</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-zinc-500 uppercase flex items-center gap-2">
                      <Users className="w-3 h-3" />
                      Min Members / 最小成员数
                    </label>
                    <select 
                      value={minMembers} 
                      onChange={(e) => setMinMembers(e.target.value)}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2 text-sm outline-none focus:border-blue-500 transition-colors"
                    >
                      <option value="">Any Count / 任意数量</option>
                      <option value="1000">1,000+</option>
                      <option value="5000">5,000+</option>
                      <option value="10000">10,000+</option>
                      <option value="50000">50,000+</option>
                    </select>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Categories */}
          <div className="flex flex-wrap justify-center gap-3 mt-8">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-full border transition-all duration-200",
                  activeCategory === cat.id
                    ? "bg-white text-black border-white shadow-lg shadow-white/10"
                    : "bg-zinc-900/50 text-zinc-400 border-zinc-800 hover:border-zinc-700 hover:text-zinc-200"
                )}
              >
                {cat.icon}
                <span className="text-sm font-medium">{cat.labelEn} / {cat.labelCn}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Results Area */}
        <main className="space-y-8">
          <AnimatePresence mode="wait">
            {isSearching && currentPage === 1 ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-20 text-zinc-500"
              >
                <div className="relative w-16 h-16 mb-6">
                  <div className="absolute inset-0 border-4 border-blue-500/20 rounded-full" />
                  <div className="absolute inset-0 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                </div>
                <p className="text-lg animate-pulse">Scanning Telegram network... / 正在扫描 Telegram 网络...</p>
                <p className="text-sm mt-2 opacity-60">This might take a few seconds / 这可能需要几秒钟</p>
              </motion.div>
            ) : results ? (
              <motion.div
                key="results"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 backdrop-blur-sm"
              >
                <div className="flex items-center justify-between mb-8 pb-4 border-b border-zinc-800">
                  <h2 className="text-xl font-semibold flex items-center gap-2">
                    <Filter className="w-5 h-5 text-blue-400" />
                    Search Results / 搜索结果 {currentPage > 1 && <span className="text-zinc-500 text-sm">(Page / 第 {currentPage} 页)</span>}
                  </h2>
                </div>
                
                <div className="prose prose-invert max-w-none prose-headings:text-white prose-a:text-blue-400 prose-strong:text-white">
                  <ReactMarkdown
                    components={{
                      a: ({ href, children }) => (
                        <span className="inline-flex items-center flex-wrap">
                          <a href={href} target="_blank" rel="noopener noreferrer" className="hover:underline">
                            {children}
                          </a>
                          {href?.includes('t.me') && <CopyButton text={href} />}
                        </span>
                      )
                    }}
                  >
                    {results}
                  </ReactMarkdown>
                </div>

                {/* Pagination Controls */}
                <div className="mt-12 pt-8 border-t border-zinc-800 flex items-center justify-between">
                  <button
                    onClick={handlePrevPage}
                    disabled={currentPage === 1 || isSearching}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Previous / 上一页</span>
                  </button>
                  <div className="text-sm text-zinc-500">
                    Page / 第 <span className="text-white font-medium">{currentPage}</span> 页
                  </div>
                  <button
                    onClick={handleNextPage}
                    disabled={isSearching}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Next Page / 下一页</span>}
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="mt-12 pt-8 border-t border-zinc-800 grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="flex items-start gap-4 p-4 rounded-2xl bg-zinc-800/30 border border-zinc-700/50">
                    <Shield className="w-6 h-6 text-emerald-400 shrink-0" />
                    <div>
                      <h4 className="text-sm font-semibold mb-1">Safety First / 安全第一</h4>
                      <p className="text-xs text-zinc-500">Always verify links before downloading. Avoid suspicious bots. / 下载前请务必验证链接。避开可疑机器人。</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 p-4 rounded-2xl bg-zinc-800/30 border border-zinc-700/50">
                    <Zap className="w-6 h-6 text-yellow-400 shrink-0" />
                    <div>
                      <h4 className="text-sm font-semibold mb-1">High Speed / 高速</h4>
                      <p className="text-xs text-zinc-500">Real-time indexing of public Telegram resources. / 实时索引公开的 Telegram 资源。</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 p-4 rounded-2xl bg-zinc-800/30 border border-zinc-700/50">
                    <Globe className="w-6 h-6 text-blue-400 shrink-0" />
                    <div>
                      <h4 className="text-sm font-semibold mb-1">Global Reach / 全球覆盖</h4>
                      <p className="text-xs text-zinc-500">Searching across thousands of global communities. / 搜索数千个全球社区。</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : error ? (
              <motion.div
                key="error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-8 rounded-3xl bg-red-500/10 border border-red-500/20 text-red-400 flex flex-col items-center gap-4 text-center"
              >
                <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-lg font-semibold mb-1">{error.en}</p>
                  <p className="text-sm opacity-80">{error.cn}</p>
                </div>
                <button 
                  onClick={() => handleSearch(undefined, currentPage)}
                  className="px-6 py-2 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition-colors"
                >
                  Retry / 重试
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
              >
                <div className="p-8 rounded-3xl bg-zinc-900/30 border border-zinc-800/50 flex flex-col justify-between">
                  <div>
                    <h3 className="text-xl font-semibold mb-4">Recent Searches / 最近搜索</h3>
                    {recentSearches.length > 0 ? (
                      <div className="space-y-2">
                        {recentSearches.map((s, i) => (
                          <button 
                            key={i} 
                            onClick={() => { setQuery(s); handleSearch(undefined, 1); }}
                            className="w-full text-left px-4 py-2 rounded-xl hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors flex items-center justify-between group"
                          >
                            <span>{s}</span>
                            <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-zinc-600 italic">No recent searches yet. / 暂无最近搜索。</p>
                    )}
                  </div>
                  <div className="mt-8 pt-8 border-t border-zinc-800/50">
                    <p className="text-xs text-zinc-500">Your search history is stored locally. / 您的搜索历史记录存储在本地。</p>
                  </div>
                </div>

                <div className="p-8 rounded-3xl bg-gradient-to-br from-blue-600/10 to-purple-600/10 border border-blue-500/20">
                  <h3 className="text-xl font-semibold mb-4">Pro Tips / 专业技巧</h3>
                  <ul className="space-y-4">
                    <li className="flex gap-3">
                      <div className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-[10px] font-bold text-blue-400">1</span>
                      </div>
                      <p className="text-sm text-zinc-400">Use specific keywords like "Python course" or "Sci-fi movies" for better results. / 使用“Python 课程”或“科幻电影”等特定关键词以获得更好的结果。</p>
                    </li>
                    <li className="flex gap-3">
                      <div className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-[10px] font-bold text-blue-400">2</span>
                      </div>
                      <p className="text-sm text-zinc-400">Switch categories to filter specifically for PDFs or Videos. / 切换类别以专门筛选 PDF 或视频。</p>
                    </li>
                    <li className="flex gap-3">
                      <div className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-[10px] font-bold text-blue-400">3</span>
                      </div>
                      <p className="text-sm text-zinc-400">Look for "t.me" links in the results for direct access to Telegram. / 在结果中查找“t.me”链接以直接访问 Telegram。</p>
                    </li>
                  </ul>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* How it Works Section */}
        <section className="mt-24 pt-12 border-t border-zinc-900">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">How it Works / 工作原理</h2>
            <p className="text-zinc-500">TeleSearch Pro uses advanced AI to index the Telegram ecosystem. / TeleSearch Pro 使用先进的 AI 来索引 Telegram 生态系统。</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="p-8 rounded-3xl bg-zinc-900/30 border border-zinc-800/50">
              <h3 className="text-xl font-semibold mb-6 flex items-center gap-2 text-blue-400">
                <Globe className="w-5 h-5" />
                English Guide
              </h3>
              <ul className="space-y-4 text-sm text-zinc-400">
                <li className="flex gap-3">
                  <span className="text-blue-500 font-bold">01.</span>
                  <p><strong className="text-white">Real-time Indexing:</strong> Our AI uses Google Search Grounding to scan millions of web pages and directories for active Telegram links.</p>
                </li>
                <li className="flex gap-3">
                  <span className="text-blue-500 font-bold">02.</span>
                  <p><strong className="text-white">Link Verification:</strong> The system filters out dead or suspicious links by analyzing recent activity and community mentions.</p>
                </li>
                <li className="flex gap-3">
                  <span className="text-blue-500 font-bold">03.</span>
                  <p><strong className="text-white">Direct Access:</strong> We provide "t.me" URLs which open directly in your Telegram app, ensuring you reach the real destination.</p>
                </li>
              </ul>
            </div>

            <div className="p-8 rounded-3xl bg-zinc-900/30 border border-zinc-800/50">
              <h3 className="text-xl font-semibold mb-6 flex items-center gap-2 text-purple-400">
                <Zap className="w-5 h-5" />
                中文指南
              </h3>
              <ul className="space-y-4 text-sm text-zinc-400">
                <li className="flex gap-3">
                  <span className="text-purple-500 font-bold">01.</span>
                  <p><strong className="text-white">实时索引：</strong> 我们的 AI 利用 Google 搜索技术扫描数百万个网页和目录，寻找活跃的 Telegram 链接。</p>
                </li>
                <li className="flex gap-3">
                  <span className="text-purple-500 font-bold">02.</span>
                  <p><strong className="text-white">链接验证：</strong> 系统通过分析最近的活动和社区提及，自动过滤掉失效或可疑的链接，确保频道真实有效。</p>
                </li>
                <li className="flex gap-3">
                  <span className="text-purple-500 font-bold">03.</span>
                  <p><strong className="text-white">直接访问：</strong> 我们提供 "t.me" 官方短链接，可直接在 Telegram 应用中打开，确保您到达真实的频道目的地。</p>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-20 pt-12 border-t border-zinc-900 text-center">
          <div className="max-w-md mx-auto space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800">
                <p className="text-blue-400 font-bold text-sm mb-1">@Esaysearchbot</p>
                <p className="text-zinc-500 text-xs">主要机器人 / Main Bot</p>
              </div>
              <div className="p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800">
                <p className="text-purple-400 font-bold text-sm mb-1">@HisFilesBot</p>
                <p className="text-zinc-500 text-xs">备用机器人 / Backup Bot</p>
              </div>
            </div>
            <p className="text-zinc-400 text-sm">如果被封了 请使用备用 / If blocked, please use backup</p>
            <div className="pt-8 text-zinc-600 text-xs flex items-center justify-center gap-2">
              <span>作者 / Author:</span>
              <a href="https://t.me/Tgfruit" target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:text-white transition-colors font-medium">@Tgfruit</a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
