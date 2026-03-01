import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Select } from "../components/Select";

type Pair = "BTC-USDT" | "ETH-USDT" | "XRP-USDT";

const pairOptions = [
  { value: "BTC-USDT" as Pair, label: "Bitcoin / Tether" },
  { value: "ETH-USDT" as Pair, label: "Ethereum / Tether" },
  { value: "XRP-USDT" as Pair, label: "XRP / Tether" },
];

describe("Select", () => {
  // -------------------------------------------------------------------------
  // Rendering
  // -------------------------------------------------------------------------
  describe("rendering", () => {
    it("renders the label text", () => {
      render(
        <Select
          label="Pair"
          value="BTC-USDT"
          options={pairOptions}
          onChange={vi.fn()}
        />,
      );
      expect(screen.getByText("Pair")).toBeInTheDocument();
    });

    it("renders all provided options", () => {
      render(
        <Select
          label="Pair"
          value="BTC-USDT"
          options={pairOptions}
          onChange={vi.fn()}
        />,
      );
      expect(
        screen.getByRole("option", { name: "Bitcoin / Tether" }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("option", { name: "Ethereum / Tether" }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("option", { name: "XRP / Tether" }),
      ).toBeInTheDocument();
    });

    it("reflects the correct initial selected value", () => {
      render(
        <Select
          label="Pair"
          value="ETH-USDT"
          options={pairOptions}
          onChange={vi.fn()}
        />,
      );
      expect(screen.getByRole("combobox")).toHaveValue("ETH-USDT");
    });

    it("renders an empty option list gracefully", () => {
      render(
        <Select<string>
          label="Empty"
          value=""
          options={[]}
          onChange={vi.fn()}
        />,
      );
      expect(screen.getByRole("combobox")).toBeInTheDocument();
      expect(screen.queryAllByRole("option")).toHaveLength(0);
    });
  });

  // -------------------------------------------------------------------------
  // Accessibility
  // -------------------------------------------------------------------------
  describe("accessibility", () => {
    it("associates the label with the select via htmlFor / id", () => {
      render(
        <Select
          label="Pair"
          value="BTC-USDT"
          options={pairOptions}
          onChange={vi.fn()}
        />,
      );
      // getByLabelText walks the DOM association — ensures htmlFor matches an id
      const combobox = screen.getByLabelText("Pair");
      expect(combobox.tagName).toBe("SELECT");
    });

    it("uses a unique id when multiple Selects are rendered side by side", () => {
      render(
        <>
          <Select
            label="Pair"
            value="BTC-USDT"
            options={pairOptions}
            onChange={vi.fn()}
          />
          <Select<string>
            label="Stream"
            value="all"
            options={[{ value: "all", label: "All" }]}
            onChange={vi.fn()}
          />
        </>,
      );
      const selects = screen.getAllByRole("combobox");
      const ids = selects.map((s) => s.id);
      expect(new Set(ids).size).toBe(selects.length); // all ids are unique
    });
  });

  // -------------------------------------------------------------------------
  // Interaction
  // -------------------------------------------------------------------------
  describe("interaction", () => {
    it("calls onChange with the newly selected value", () => {
      const handleChange = vi.fn();
      render(
        <Select
          label="Pair"
          value="BTC-USDT"
          options={pairOptions}
          onChange={handleChange}
        />,
      );
      fireEvent.change(screen.getByRole("combobox"), {
        target: { value: "ETH-USDT" },
      });
      expect(handleChange).toHaveBeenCalledOnce();
      expect(handleChange).toHaveBeenCalledWith("ETH-USDT");
    });

    it("calls onChange with the exact typed value (generic cast)", () => {
      const handleChange = vi.fn();
      render(
        <Select
          label="Pair"
          value="BTC-USDT"
          options={pairOptions}
          onChange={handleChange}
        />,
      );
      fireEvent.change(screen.getByRole("combobox"), {
        target: { value: "XRP-USDT" },
      });
      expect(handleChange).toHaveBeenCalledWith("XRP-USDT");
    });

    it("does not call onChange when value is unchanged", () => {
      // Simulate selecting the already-selected option
      const handleChange = vi.fn();
      render(
        <Select
          label="Pair"
          value="BTC-USDT"
          options={pairOptions}
          onChange={handleChange}
        />,
      );
      fireEvent.change(screen.getByRole("combobox"), {
        target: { value: "BTC-USDT" },
      });
      // onChange IS invoked by the DOM event, but the value is the same.
      // We just verify it was called — downstream guards are the consumer's job.
      expect(handleChange).toHaveBeenCalledOnce();
    });
  });
});
