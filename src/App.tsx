import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "@/pages/Home";

// 使用 Vite 的 BASE_URL 作为路由 basename，自动适配子路径部署
// 开发环境为 "/"，生产环境为 "/trae-mario-game/"
const ROUTER_BASENAME = import.meta.env.BASE_URL;

export default function App() {
  return (
    <Router basename={ROUTER_BASENAME}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/other" element={<div className="text-center text-xl">Other Page - Coming Soon</div>} />
      </Routes>
    </Router>
  );
}
