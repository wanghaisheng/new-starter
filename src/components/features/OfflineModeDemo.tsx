import React, { useState, useEffect } from 'react';
import { AppService } from '@/core/services/app-service';
import { v4 as uuidv4 } from 'uuid';

interface OfflineNote {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

export default function OfflineModeDemo() {
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [notes, setNotes] = useState<OfflineNote[]>([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState('');

  // Load initial state
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      
      try {
        // 初始化 AppService
        const appService = AppService.getInstance();
        await appService.initialize();
        
        // 获取当前离线模式状态
        setIsOfflineMode(appService.isOfflineMode());
        
        // 加载离线笔记
        await loadNotes();
      } catch (error) {
        console.error('初始化失败:', error);
        setStatusMessage('初始化失败，请刷新页面重试');
      } finally {
        setLoading(false);
      }
    };
    
    init();
  }, []);
  
  // 加载离线笔记
  const loadNotes = async () => {
    try {
      const appService = AppService.getInstance();
      const offlineStorage = appService.getOfflineStorage();
      
      // 确保表存在
      const notes = await offlineStorage.getAll('offline_notes') as OfflineNote[];
      setNotes(notes || []);
    } catch (error) {
      console.error('加载笔记失败:', error);
      setStatusMessage('加载笔记失败');
    }
  };
  
  // 切换离线模式
  const toggleOfflineMode = () => {
    const appService = AppService.getInstance();
    const newMode = !isOfflineMode;
    
    appService.toggleOfflineMode(newMode);
    setIsOfflineMode(newMode);
    
    setStatusMessage(newMode 
      ? '已切换到离线模式，数据将仅存储在本地设备' 
      : '已切换到在线模式，数据可能会与服务器同步');
  };
  
  // 添加新笔记
  const addNote = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      setStatusMessage('请输入笔记标题');
      return;
    }
    
    try {
      const appService = AppService.getInstance();
      const offlineStorage = appService.getOfflineStorage();
      
      const now = new Date();
      const newNote: OfflineNote = {
        id: uuidv4(),
        title: title.trim(),
        content: content.trim(),
        createdAt: now,
        updatedAt: now
      };
      
      await offlineStorage.create('offline_notes', newNote);
      
      // 重新加载笔记
      await loadNotes();
      
      // 清空表单
      setTitle('');
      setContent('');
      setStatusMessage('笔记已保存');
    } catch (error) {
      console.error('保存笔记失败:', error);
      setStatusMessage('保存笔记失败，请重试');
    }
  };
  
  // 删除笔记
  const deleteNote = async (id: string) => {
    try {
      const appService = AppService.getInstance();
      const offlineStorage = appService.getOfflineStorage();
      
      await offlineStorage.delete('offline_notes', id);
      
      // 重新加载笔记
      await loadNotes();
      setStatusMessage('笔记已删除');
    } catch (error) {
      console.error('删除笔记失败:', error);
      setStatusMessage('删除笔记失败，请重试');
    }
  };
  
  // 尝试同步数据
  const syncData = async () => {
    try {
      setStatusMessage('正在尝试同步数据...');
      const appService = AppService.getInstance();
      const success = await appService.triggerSync();
      
      if (success) {
        setStatusMessage('数据同步成功');
      } else {
        setStatusMessage('数据同步失败，可能处于离线模式或网络不可用');
      }
    } catch (error) {
      console.error('同步失败:', error);
      setStatusMessage('同步过程中发生错误');
    }
  };
  
  if (loading) {
    return <div className="p-4">正在加载...</div>;
  }
  
  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">离线模式演示</h1>
      
      {/* 状态信息 */}
      {statusMessage && (
        <div className="mb-4 p-2 bg-blue-50 border border-blue-200 rounded">
          {statusMessage}
        </div>
      )}
      
      {/* 离线模式控制 */}
      <div className="mb-6 flex items-center">
        <span className="mr-2">离线模式:</span>
        <button
          onClick={toggleOfflineMode}
          className={`px-4 py-2 rounded ${
            isOfflineMode 
              ? 'bg-green-500 text-white' 
              : 'bg-gray-200 text-gray-800'
          }`}
        >
          {isOfflineMode ? '已开启' : '已关闭'}
        </button>
        
        <button 
          onClick={syncData}
          className="ml-4 px-4 py-2 bg-blue-500 text-white rounded"
        >
          尝试同步
        </button>
      </div>
      
      {/* 添加笔记表单 */}
      <div className="mb-6 p-4 border rounded">
        <h2 className="text-xl font-semibold mb-2">添加离线笔记</h2>
        <form onSubmit={addNote}>
          <div className="mb-3">
            <label className="block mb-1">标题</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border rounded"
              placeholder="输入笔记标题"
            />
          </div>
          
          <div className="mb-3">
            <label className="block mb-1">内容</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full px-3 py-2 border rounded"
              rows={4}
              placeholder="输入笔记内容"
            />
          </div>
          
          <button
            type="submit"
            className="px-4 py-2 bg-green-500 text-white rounded"
          >
            保存笔记
          </button>
        </form>
      </div>
      
      {/* 笔记列表 */}
      <div>
        <h2 className="text-xl font-semibold mb-2">离线笔记 ({notes.length})</h2>
        
        {notes.length === 0 ? (
          <p className="text-gray-500">暂无笔记，请添加一条新笔记</p>
        ) : (
          <ul className="divide-y">
            {notes.map((note) => (
              <li key={note.id} className="py-3">
                <div className="flex justify-between">
                  <h3 className="font-medium">{note.title}</h3>
                  <button
                    onClick={() => deleteNote(note.id)}
                    className="text-red-500"
                  >
                    删除
                  </button>
                </div>
                
                <p className="text-gray-700 mt-1">{note.content}</p>
                
                <div className="text-xs text-gray-500 mt-1">
                  创建时间: {new Date(note.createdAt).toLocaleString()}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
} 