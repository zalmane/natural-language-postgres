import React, { useState } from "react";
import { ChevronDown, Menu, Home, Search, Wrench, Hammer } from "lucide-react";

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div
      className={`flex flex-col h-screen bg-white border-r transition-all duration-200 ${
        collapsed ? "w-16" : "w-64"
      }`}
    >
      {/* Top: Collapse Button & Logo */}
      <div className="flex items-center gap-2 p-4">
        <button
          className="p-2 rounded hover:bg-gray-100"
          onClick={() => setCollapsed((c) => !c)}
        >
          <Menu size={20} />
        </button>
        {!collapsed && (
          <span className="ml-2 flex items-center gap-2">
            {/* Replace with your logo */}
            <span className="h-8 w-8 bg-gradient-to-tr from-pink-400 via-purple-400 to-blue-400 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">R</span>
            </span>
            <span className="font-bold text-lg text-[#2B2B4F]">RIVERPOOL</span>
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2">
        <ul className="space-y-1 mt-2">
          <li>
            <a
              href="#"
              className="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-100 text-gray-700"
            >
              <Home size={20} />
              {!collapsed && <span>Home</span>}
            </a>
          </li>
          <li>
            <a
              href="#"
              className="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-100 text-gray-700"
            >
              <Search size={20} />
              {!collapsed && <span>Explore</span>}
            </a>
          </li>
          <li>
            <a
              href="#"
              className="flex items-center gap-3 px-3 py-2 rounded bg-gray-100 text-gray-700"
            >
              <Wrench size={20} />
              {!collapsed && <span>Resolve</span>}
            </a>
          </li>
          <li>
            <a
              href="#"
              className="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-100 text-gray-700"
            >
              <Hammer size={20} />
              {!collapsed && (
                <>
                  <span>Build</span>
                  <span className="ml-2 bg-yellow-400 text-xs font-bold px-2 py-0.5 rounded-full text-white">
                    Soon
                  </span>
                </>
              )}
            </a>
          </li>
        </ul>
      </nav>

      {/* Bottom: Account/Org Switcher, Demo Mode, User */}
      <div className="p-4 border-t mt-auto">
        {/* Org Switcher */}
        <div className="mb-3">
          <div className="relative">
            <select
              className="w-full border rounded px-2 py-1 text-sm"
              disabled={collapsed}
              defaultValue="BigBank"
            >
              <option>BigBank</option>
              <option>OtherOrg</option>
            </select>
            <ChevronDown
              size={16}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
          </div>
        </div>
        {/* Demo Mode */}
        <div className="flex items-center mb-3">
          <input
            type="checkbox"
            checked
            readOnly
            className="accent-blue-600 w-4 h-4"
            disabled={collapsed}
          />
          {!collapsed && (
            <label className="ml-2 text-sm text-gray-700">Demo Mode</label>
          )}
        </div>
        {/* User Info */}
        <div className="flex items-center gap-2">
          <div className="bg-gray-200 rounded-full w-8 h-8 flex items-center justify-center text-gray-600 font-bold text-sm">
            SC
          </div>
          {!collapsed && (
            <div>
              <div className="font-semibold text-sm">Sarah Chen</div>
              <div className="text-xs text-gray-500">sarah.chen@bigbank.com</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 