import Link from "next/link";
import { FiClock, FiHome } from "react-icons/fi";
import "./page.scss";

export default function ComingSoon() {
  return (
    <div className="coming-soon-container">
      <div className="coming-soon-content">
        <div className="icon-container">
          <FiClock size={48} className="clock-icon" />
        </div>
        <h1>Coming Soon</h1>
        <p>
          We're working hard to bring you an amazing experience. This feature
          will be available shortly.
        </p>

        <div className="progress-container">
          <div className="progress-bar">
            <div className="progress" style={{ width: "75%" }}></div>
          </div>
          <span className="progress-text">75% Complete</span>
        </div>

        <Link href="/experientia" className="home-link">
          <FiHome className="home-icon" />
          Back to Home
        </Link>
      </div>
    </div>
  );
}
