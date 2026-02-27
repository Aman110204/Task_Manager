import { render, screen } from "@testing-library/react";
import App from "./App";

test("renders local task manager heading", () => {
  render(<App />);
  expect(screen.getByText(/local task manager/i)).toBeInTheDocument();
});
