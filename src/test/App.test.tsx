import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import App from "../App";

describe("App", () => {
  it("renders the main dashboard heading", () => {
    render(<App />);

    const heading = screen.getByRole("heading", {
      name: /crypto data dashboard/i,
    });

    expect(heading).toBeInTheDocument();
  });
});
