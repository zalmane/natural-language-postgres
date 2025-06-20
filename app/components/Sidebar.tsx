import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { Home, Search, Wrench, Construction, ChevronRight, Plus, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

interface ChatHistory {
  id: string;
  title: string;
  preview: string;
  timestamp: Date;
}

const blueprints = [
    { id: 'bigbank', name: 'BigBank' },
    { id: 'retailmart', name: 'RetailMartInsights' },
    { id: 'healthcare', name: 'HealthCareLogistics' },
    { id: 'finance', name: 'FinanceDevEnv' },
]

export function Sidebar() {
  const pathname = usePathname();
  const [selectedBlueprint, setSelectedBlueprint] = React.useState(blueprints[0]);
  const [chatHistory, setChatHistory] = React.useState<ChatHistory[]>([
    {
      id: '1',
      title: 'Understanding ARR Calculation',
      preview: 'How do we calculate ARR?',
      timestamp: new Date('2024-03-10T10:00:00'),
    },
    {
      id: '2',
      title: 'Customer Payment Sources',
      preview: 'What is the source of our customer payment information?',
      timestamp: new Date('2024-03-09T15:30:00'),
    },
    // Add more mock chat history as needed
  ]);

  return (
    <div className="w-64 h-screen flex flex-col bg-white border-r">
      {/* Logo */}
      <div className="p-4 border-b">
        <Image
          src="/riverpool_logo.svg"
          alt="RiverPool"
          width={120}
          height={32}
          className="dark:invert"
        />
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-1">
        <Link
          href="/"
          className={cn(
            "flex items-center px-3 py-2 text-sm rounded-lg",
            pathname === "/" ? "bg-gray-100" : "hover:bg-gray-50"
          )}
        >
          <Home className="w-4 h-4 mr-3" />
          Home
        </Link>
        <Link
          href="/explore"
          className={cn(
            "flex items-center px-3 py-2 text-sm rounded-lg",
            pathname === "/explore" ? "bg-gray-100" : "hover:bg-gray-50"
          )}
        >
          <Search className="w-4 h-4 mr-3" />
          Explore
        </Link>
        <Link
          href="/resolve"
          className={cn(
            "flex items-center px-3 py-2 text-sm rounded-lg",
            pathname === "/resolve" ? "bg-gray-100" : "hover:bg-gray-50"
          )}
        >
          <Wrench className="w-4 h-4 mr-3" />
          Resolve
        </Link>
        <Link
          href="/build"
          className={cn(
            "flex items-center px-3 py-2 text-sm rounded-lg group relative",
            pathname === "/build" ? "bg-gray-100" : "hover:bg-gray-50"
          )}
        >
          <Construction className="w-4 h-4 mr-3" />
          Build
          <span className="absolute right-2 px-2 py-0.5 text-xs bg-yellow-100 text-yellow-800 rounded-full">
            Soon
          </span>
        </Link>
      </nav>

      {/* Chat History */}
      <div className="flex-1 overflow-y-auto border-t">
        <div className="p-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-medium text-gray-900">Chat History</h2>
            <button className="p-1 hover:bg-gray-100 rounded-lg">
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-1">
            {chatHistory.map((chat) => (
              <Link
                key={chat.id}
                href={`/chat/${chat.id}`}
                className="block p-2 hover:bg-gray-50 rounded-lg"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {chat.title}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {chat.preview}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* User Section */}
      <div className="p-4 border-t">
        <div className="mb-4">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <button className="w-full flex items-center justify-between p-2 text-sm rounded-lg border hover:bg-gray-50">
                        <span>{selectedBlueprint.name}</span>
                        <ChevronsUpDown className="w-4 h-4 text-gray-400" />
                    </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56">
                    <DropdownMenuLabel>Select Blueprint</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {blueprints.map(blueprint => (
                        <DropdownMenuItem key={blueprint.id} onSelect={() => setSelectedBlueprint(blueprint)}>
                            {blueprint.name}
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
            <span className="text-sm font-medium">SC</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900">Sarah Chen</p>
            <p className="text-xs text-gray-500 truncate">sarah.chen@bigbank.com</p>
          </div>
        </div>
        <div className="mt-2">
          <label className="flex items-center">
            <input type="checkbox" className="rounded border-gray-300" defaultChecked />
            <span className="ml-2 text-sm text-gray-600">Demo Mode</span>
          </label>
        </div>
      </div>
    </div>
  );
} 