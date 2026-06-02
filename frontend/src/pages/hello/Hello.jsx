import { useState } from "react";

import "./Hello.css";

const Hello = () => {
  const [count, setCount] = useState(0);

  return (
    <>
      <section id="navbar">
        <div class="navbar">
          <h1>Event Roots</h1>
        </div>
      </section>

      <section id="center">
        <button
          type="button"
          className="counter"
          onClick={() => setCount((count) => count + 1)}
        >
          Count is {count}
        </button>
      </section>
    </>
  );
};

export default Hello;
