import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown } from 'lucide-react';
import { useDb } from '../../hooks/useDb';
import type { Resource } from '../../types';

interface ResourceChecklistProps {
  selectedIds: number[];
  onChange: (ids: number[]) => void;
}

export default function ResourceChecklist({ selectedIds, onChange }: ResourceChecklistProps) {
  const { query } = useDb();
  const [open, setOpen] = useState(false);
  const [menuRect, setMenuRect] = useState({ top: 0, left: 0, width: 0 });
  const ref = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const resources = query<Resource>('SELECT * FROM resources ORDER BY name');

  const updateMenuRect = useCallback(() => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    setMenuRect({
      top: rect.bottom + 4,
      left: rect.left,
      width: rect.width,
    });
  }, []);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (
        ref.current &&
        !ref.current.contains(target) &&
        menuRef.current &&
        !menuRef.current.contains(target)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    updateMenuRect();
    window.addEventListener('resize', updateMenuRect);
    window.addEventListener('scroll', updateMenuRect, true);
    return () => {
      window.removeEventListener('resize', updateMenuRect);
      window.removeEventListener('scroll', updateMenuRect, true);
    };
  }, [open, updateMenuRect]);

  const label = useMemo(() => {
    const selectedNames = resources
      .filter((resource) => selectedIds.includes(resource.id))
      .map((resource) => resource.name);
    return selectedNames.join(', ');
  }, [resources, selectedIds]);

  const toggle = (resourceId: number) => {
    if (selectedIds.includes(resourceId)) {
      onChange(selectedIds.filter((id) => id !== resourceId));
      return;
    }
    onChange([...selectedIds, resourceId]);
  };

  return (
    <div className="relative min-w-60" ref={ref}>
      <button
        type="button"
        onClick={() => {
          updateMenuRect();
          setOpen((current) => !current);
        }}
        className="flex h-8 w-full items-center gap-2 rounded border border-gray-300 bg-white px-2 text-left text-sm hover:border-blue-500"
      >
        <span className={`flex-1 truncate ${label ? 'text-gray-800' : 'text-gray-500'}`}>
          {label || '- Select resources -'}
        </span>
        <ChevronDown size={15} className="shrink-0 text-gray-500" aria-hidden="true" />
      </button>

      {open &&
        createPortal(
          <div
            ref={menuRef}
            className="fixed z-[1000] max-h-64 overflow-y-auto rounded border border-gray-300 bg-white py-1 text-sm shadow-xl"
            style={{
              top: menuRect.top,
              left: menuRect.left,
              width: Math.max(menuRect.width, 256),
            }}
          >
            {resources.length === 0 ? (
              <p className="px-3 py-2 text-sm text-gray-500">No resources found.</p>
            ) : (
              resources.map((resource) => (
                <label key={resource.id} className="flex cursor-pointer items-center gap-2 px-3 py-1.5 hover:bg-blue-50">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(resource.id)}
                    onChange={() => toggle(resource.id)}
                    className="accent-blue-700"
                  />
                  <span className="text-gray-800">{resource.name}</span>
                  <span className="ml-auto text-xs text-gray-500">{resource.type}</span>
                </label>
              ))
            )}
          </div>,
          document.body,
        )}
    </div>
  );
}
