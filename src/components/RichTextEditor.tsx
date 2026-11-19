import { useEffect, useRef } from 'react';
import { Bold, Italic, List, ListOrdered, Heading3, Link as LinkIcon, RemoveFormatting } from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Matnni kiriting...",
  minHeight = 220,
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || '';
    }
  }, [value]);

  const exec = (cmd: string, arg?: string) => {
    document.execCommand(cmd, false, arg);
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const addLink = () => {
    const url = window.prompt('Havola manzilini kiriting (https://...):');
    if (url && /^https?:\/\//i.test(url)) {
      exec('createLink', url);
    }
  };

  return (
    <div className="border border-[#E5ECE8] rounded-xl overflow-hidden bg-white focus-within:border-[#078A59] transition-colors">
      <div className="flex flex-wrap items-center gap-1 px-3 py-2 bg-[#F5F8FA] border-b border-[#E5ECE8]">
        <button
          type="button"
          onClick={() => exec('bold')}
          className="p-1.5 rounded-lg hover:bg-white text-[#17212B] transition-colors"
          title="Qalin"
        >
          <Bold className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => exec('italic')}
          className="p-1.5 rounded-lg hover:bg-white text-[#17212B] transition-colors"
          title="Qiyshiq"
        >
          <Italic className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => exec('formatBlock', 'h3')}
          className="p-1.5 rounded-lg hover:bg-white text-[#17212B] transition-colors"
          title="Sarlavha"
        >
          <Heading3 className="w-4 h-4" />
        </button>
        <span className="w-px h-5 bg-[#E5ECE8] mx-1" />
        <button
          type="button"
          onClick={() => exec('insertUnorderedList')}
          className="p-1.5 rounded-lg hover:bg-white text-[#17212B] transition-colors"
          title="Nuqtali ro'yxat"
        >
          <List className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => exec('insertOrderedList')}
          className="p-1.5 rounded-lg hover:bg-white text-[#17212B] transition-colors"
          title="Raqamli ro'yxat"
        >
          <ListOrdered className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={addLink}
          className="p-1.5 rounded-lg hover:bg-white text-[#17212B] transition-colors"
          title="Havola qo'shish"
        >
          <LinkIcon className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => exec('removeFormat')}
          className="p-1.5 rounded-lg hover:bg-white text-[#718096] transition-colors ml-auto"
          title="Formatlashni tozalash"
        >
          <RemoveFormatting className="w-4 h-4" />
        </button>
      </div>
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={() => {
          if (editorRef.current) onChange(editorRef.current.innerHTML);
        }}
        data-placeholder={placeholder}
        style={{ minHeight }}
        className="p-4 text-sm text-[#17212B] outline-none rich-content empty:before:content-[attr(data-placeholder)] empty:before:text-[#718096]"
      />
    </div>
  );
}
