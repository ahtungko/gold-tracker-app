import React from "react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { I18nextProvider } from "react-i18next";

import { LanguageSwitcher } from "../LanguageSwitcher";
import i18n from "../../i18n";

const renderLanguageSwitcher = () =>
  render(
    <I18nextProvider i18n={i18n}>
      <LanguageSwitcher />
    </I18nextProvider>,
  );

beforeEach(async () => {
  window.localStorage.clear();
  await i18n.changeLanguage("en");
});

afterEach(() => {
  cleanup();
});

describe("LanguageSwitcher", () => {
  it("marks the current language as active", () => {
    renderLanguageSwitcher();

    const englishButton = screen.getByRole("button", { name: /English currently selected/i });

    expect(englishButton.getAttribute("aria-pressed")).toBe("true");
  });

  it("switches language and persists the preference", async () => {
    const user = userEvent.setup();

    renderLanguageSwitcher();

    const chineseToggle = screen.getByRole("button", { name: /Switch to Chinese/i });
    await user.click(chineseToggle);

    await waitFor(() => {
      const chineseButton = screen.getByRole("button", { name: /中文/ });
      expect(chineseButton.getAttribute("aria-pressed")).toBe("true");
    });

    await waitFor(() => {
      expect(window.localStorage.getItem("i18nextLng")).toBe("zh");
    });

    await waitFor(() => {
      expect(i18n.language.startsWith("zh")).toBe(true);
    });
  });

  it("initializes from a persisted language selection", async () => {
    await i18n.changeLanguage("en");
    window.localStorage.setItem("i18nextLng", "zh");

    renderLanguageSwitcher();

    await waitFor(() => {
      const chineseButton = screen.getByRole("button", { name: /中文/ });
      expect(chineseButton.getAttribute("aria-pressed")).toBe("true");
    });

    await waitFor(() => {
      expect(i18n.language.startsWith("zh")).toBe(true);
    });

    expect(window.localStorage.getItem("i18nextLng")).toBe("zh");
  });
});
