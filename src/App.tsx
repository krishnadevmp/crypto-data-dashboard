import "./App.css";
import CandleChart from "./domain/CandleChart";

function App() {
  return (
    <>
      <h1>Crypto Data Dashboard</h1>
      <CandleChart pair="BTC-USDT" />
    </>
  );
}

export default App;
