"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home,
  Mail,
  FileText,
  Users,
  BarChart3,
  Settings,
  Menu,
  Filter,
  Calendar,
  Brain
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

export interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  children?: NavItem[];
}

const navigation: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { 
    name: 'Campaigns', 
    href: '/campaigns', 
    icon: Mail, 
    badge: '3',
    children: [
      { name: 'All Campaigns', href: '/campaigns', icon: Mail },
      { name: 'Schedule Management', href: '/campaigns/schedule', icon: Calendar },
      { name: 'Test Scheduling', href: '/campaigns/test-scheduling', icon: Settings },
    ]
  },
  { name: 'Templates', href: '/templates', icon: FileText },
  { 
    name: 'Contacts', 
    href: '/contacts', 
    icon: Users,
    children: [
      { name: 'All Contacts', href: '/contacts', icon: Users },
      { name: 'Segments', href: '/contacts/segments', icon: Filter },
    ]
  },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'AI Insights', href: '/ai', icon: Brain },
  { name: 'Settings', href: '/settings', icon: Settings },
];

interface SidebarProps {
  className?: string;
}

// Desktop Sidebar Component
function DesktopSidebar({ className }: { className?: string }) {
  const pathname = usePathname();

  return (
    <div className={cn("hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col", className)}>
      <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-gray-200 bg-white px-6 pb-4">
        {/* Logo */}
        <div className="flex h-16 shrink-0 items-center">
          <Link href="/dashboard" className="flex items-center space-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-r from-blue-600 to-blue-700">
              <span className="text-sm font-bold text-white">S</span>
            </div>
            <span className="text-xl font-bold text-gray-900">SmartBatch</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex flex-1 flex-col">
          <ul role="list" className="flex flex-1 flex-col gap-y-7">
            <li>
              <ul role="list" className="-mx-2 space-y-1">
                {navigation.map((item) => {
                  const isActive = pathname === item.href || 
                    (item.href !== '/dashboard' && pathname.startsWith(item.href));
                  
                  return (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        className={cn(
                          "group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold",
                          isActive
                            ? "bg-gray-50 text-blue-600"
                            : "text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                        )}
                      >
                        <item.icon 
                          className={cn(
                            "h-6 w-6 shrink-0",
                            isActive ? "text-blue-600" : "text-gray-400 group-hover:text-blue-600"
                          )}
                        />
                        <span className="flex-1">{item.name}</span>
                        {item.badge && (
                          <Badge variant="secondary" className="ml-auto">
                            {item.badge}
                          </Badge>
                        )}
                      </Link>
                      
                      {/* Submenu */}
                      {item.children && isActive && (
                        <ul className="ml-6 mt-1 space-y-1">
                          {item.children.map((childItem) => {
                            const isChildActive = pathname === childItem.href;
                            return (
                              <li key={childItem.name}>
                                <Link
                                  href={childItem.href}
                                  className={cn(
                                    "group flex gap-x-3 rounded-md p-2 text-sm leading-6",
                                    isChildActive
                                      ? "bg-blue-50 text-blue-700 font-medium"
                                      : "text-gray-600 hover:text-blue-600 hover:bg-gray-50"
                                  )}
                                >
                                  <childItem.icon 
                                    className={cn(
                                      "h-5 w-5 shrink-0",
                                      isChildActive ? "text-blue-600" : "text-gray-400 group-hover:text-blue-600"
                                    )}
                                  />
                                  {childItem.name}
                                </Link>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </li>
                  );
                })}
              </ul>
            </li>
            
            <li className="mt-auto">
              <Separator className="my-4" />
              <div className="rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 p-4">
                <h4 className="text-sm font-semibold text-gray-900">Upgrade to Pro</h4>
                <p className="mt-1 text-xs text-gray-600">
                  Unlock advanced features and unlimited campaigns
                </p>
                <Button className="mt-3 w-full" size="sm">
                  Upgrade Now
                </Button>
              </div>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );
}

// Mobile Sidebar Component
function MobileSidebar() {
  const pathname = usePathname();

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="lg:hidden">
          <Menu className="h-6 w-6" />
          <span className="sr-only">Open sidebar</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72">
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 shrink-0 items-center px-4">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-r from-blue-600 to-blue-700">
                <span className="text-sm font-bold text-white">S</span>
              </div>
              <span className="text-xl font-bold text-gray-900">SmartBatch</span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex flex-1 flex-col px-4 py-4">
            <ul role="list" className="flex flex-1 flex-col gap-y-7">
              <li>
                <ul role="list" className="space-y-1">
                  {navigation.map((item) => {
                    const isActive = pathname === item.href || 
                      (item.href !== '/dashboard' && pathname.startsWith(item.href));
                    
                    return (
                      <li key={item.name}>
                        <Link
                          href={item.href}
                          className={cn(
                            "group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold",
                            isActive
                              ? "bg-gray-50 text-blue-600"
                              : "text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                          )}
                        >
                          <item.icon 
                            className={cn(
                              "h-6 w-6 shrink-0",
                              isActive ? "text-blue-600" : "text-gray-400 group-hover:text-blue-600"
                            )}
                          />
                          <span className="flex-1">{item.name}</span>
                          {item.badge && (
                            <Badge variant="secondary" className="ml-auto">
                              {item.badge}
                            </Badge>
                          )}
                        </Link>
                        
                        {/* Submenu for mobile */}
                        {item.children && isActive && (
                          <ul className="ml-6 mt-1 space-y-1">
                            {item.children.map((childItem) => {
                              const isChildActive = pathname === childItem.href;
                              return (
                                <li key={childItem.name}>
                                  <Link
                                    href={childItem.href}
                                    className={cn(
                                      "group flex gap-x-3 rounded-md p-2 text-sm leading-6",
                                      isChildActive
                                        ? "bg-blue-50 text-blue-700 font-medium"
                                        : "text-gray-600 hover:text-blue-600 hover:bg-gray-50"
                                    )}
                                  >
                                    <childItem.icon 
                                      className={cn(
                                        "h-5 w-5 shrink-0",
                                        isChildActive ? "text-blue-600" : "text-gray-400 group-hover:text-blue-600"
                                      )}
                                    />
                                    {childItem.name}
                                  </Link>
                                </li>
                              );
                            })}
                          </ul>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </li>
              
              <li className="mt-auto">
                <Separator className="my-4" />
                <div className="rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 p-4">
                  <h4 className="text-sm font-semibold text-gray-900">Upgrade to Pro</h4>
                  <p className="mt-1 text-xs text-gray-600">
                    Unlock advanced features and unlimited campaigns
                  </p>
                  <Button className="mt-3 w-full" size="sm">
                    Upgrade Now
                  </Button>
                </div>
              </li>
            </ul>
          </nav>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default function Sidebar({ className }: SidebarProps) {
  return (
    <>
      <DesktopSidebar className={className} />
      <MobileSidebar />
    </>
  );
}
