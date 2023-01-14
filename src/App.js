import { HashRouter as Router, Route, Routes } from "react-router-dom"
import Home from "./pages/home/Home"
import CrazyDot from "./pages/crazydot/CrazyDot"

const App = () => {
  return (
    <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/crazydot" element={<CrazyDot />} />
          {/* <Route path="*" element={<h1>404</h1>} /> */}
        </Routes>
    </Router>
  )
}

export default App