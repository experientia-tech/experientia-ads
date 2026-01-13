"use client";
import Image from 'next/image';
import './page.scss';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

const SideMenu = () => {
  const pathname = usePathname();

  const menuSections = [
    {
      title: 'NAVIGATION',
      items: [
        { name: 'Overview', path: '/experientia/dashboard', icon: '📊' },
        { name: 'My Campaigns', path: '/my-campaigns', icon: '📢' },
        { name: 'Assigned Campaigns', path: '/experientia/campaigns', icon: '📋' },
        { name: 'Team Management', path: '/team-management', icon: '👥' },
      ]
    },
    {
      title: 'REPORT',
      items: [
        { name: 'Request Report', path: '/request-report', icon: '📄' },
        { name: 'My Requests', path: '/my-requests', icon: '📋' },
      ]
    },
    {
      title: 'EXECUTOR',
      items: [
        { name: 'Executor', path: '/executor', icon: '⚙️' },
      ]
    }
  ];

  return (
    <div className="side-menu">
      <nav className="navigation">
        {menuSections.map((section) => (
          <div key={section.title} className="menu-section">
            <h3 className="section-heading">{section.title}</h3>
            <ul className="nav-list">
              {section.items.map((item) => (
                <li 
                  key={item.path} 
                  className={`nav-item ${pathname === item.path ? 'active' : ''}`}
                >
                  <Link href={item.path} className="nav-link">
                    <span className="nav-icon">{item.icon}</span>
                    <span className="nav-text">{item.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
    </div>
  );
};

export default SideMenu;