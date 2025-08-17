"use client";

import { Button } from "@/components/ui/button";

interface TabItem<T = string> {
  key: T;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface TabNavigationProps<T = string> {
  tabs: TabItem<T>[];
  activeTab: T;
  onTabChange: (tabKey: T) => void;
}

export default function TabNavigation<T extends string>({
  tabs,
  activeTab,
  onTabChange,
}: TabNavigationProps<T>) {
  return (
    <div className="bg-white border-b border-gray-200 sticky top-0 z-40 -mx-4 px-4 mb-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex space-x-1 sm:space-x-8">
          {tabs.map((tab) => (
            <Button
              key={tab.key}
              variant="ghost"
              onClick={() => onTabChange(tab.key)}
              className={`flex items-center justify-center space-x-1 sm:space-x-2 px-2 sm:px-6 py-3 rounded-none border-b-2 transition-all duration-200 flex-1 sm:flex-none ${
                activeTab === tab.key
                  ? "border-blue-500 text-blue-600 bg-blue-50"
                  : "border-transparent hover:border-gray-300 hover:bg-gray-50"
              }`}
            >
              <tab.icon className="w-4 h-4 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline text-sm sm:text-base">
                {tab.label}
              </span>
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
