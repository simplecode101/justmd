import { useState, useRef, useEffect } from "react";

export interface MenuItem {
  id: string;
  label: string;
  shortcut?: string;
  separator?: boolean;
  disabled?: boolean;
}

interface MenuGroup {
  label: string;
  items: MenuItem[];
}

interface CustomMenuProps {
  menus: MenuGroup[];
  onSelect: (menuId: string, itemId: string) => void;
  isDark: boolean;
}

export function CustomMenu({ menus, onSelect, isDark }: CustomMenuProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpenIndex(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={containerRef} className={`custom-menu-bar ${isDark ? "dark" : ""}`}>
      {menus.map((menu, idx) => (
        <div key={menu.label} className="menu-group">
          <button
            className={`menu-label ${openIndex === idx ? "open" : ""}`}
            onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
            onMouseEnter={() => {
              if (openIndex !== null) setOpenIndex(idx);
            }}
          >
            {menu.label}
          </button>
          {openIndex === idx && (
            <div className="menu-dropdown">
              {menu.items.map((item) =>
                item.separator ? (
                  <div key={`sep-${item.id}`} className="menu-separator" />
                ) : (
                  <button
                    key={item.id}
                    className={`menu-item ${item.disabled ? "disabled" : ""}`}
                    onClick={() => {
                      if (!item.disabled) {
                        onSelect(menu.label, item.id);
                        setOpenIndex(null);
                      }
                    }}
                  >
                    <span>{item.label}</span>
                    {item.shortcut && <span className="shortcut">{item.shortcut}</span>}
                  </button>
                )
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
