'use client';
import React from 'react';
import { BookOpen, UtensilsCrossed } from 'lucide-react';

interface TabNavigationProps {
  activeTab: 'dishes' | 'meals';
  onTabChange: (tab: 'dishes' | 'meals') => void;
  dishCount: number;
  mealCount: number;
}

export const TabNavigation: React.FC<TabNavigationProps> = ({
  activeTab,
  onTabChange,
  dishCount,
  mealCount,
}) => {
  return (
    <nav className="tab-navigation">
      <button
        className={`tab-button ${activeTab === 'dishes' ? 'active' : ''}`}
        onClick={() => onTabChange('dishes')}
      >
        <BookOpen className="tab-icon" size={18} />
        <span>菜品库</span>
        <span className="tab-badge">{dishCount}</span>
      </button>

      <button
        className={`tab-button ${activeTab === 'meals' ? 'active' : ''}`}
        onClick={() => onTabChange('meals')}
      >
        <UtensilsCrossed className="tab-icon" size={18} />
        <span>套餐管理</span>
        <span className="tab-badge">{mealCount}</span>
      </button>
    </nav>
  );
};
