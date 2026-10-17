import { test, expect } from "@playwright/test";
test("login, cadastro e recuperação com validação", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Bom ter você por aqui." }),
  ).toBeVisible();
  await page.screenshot({
    path: "artifacts/login-desktop.png",
    fullPage: true,
  });
  await page.getByLabel("E-mail", { exact: true }).fill("time@example.com");
  await page.getByLabel("Senha", { exact: true }).fill("teste123");
  await page.getByRole("button", { name: "Mostrar senha" }).click();
  await expect(page.locator("input[name=password]")).toHaveAttribute(
    "type",
    "text",
  );
  await page
    .getByRole("button", { name: "Entrar no AZZO ROOM", exact: true })
    .click();
  await expect(page.locator(".auth-form").getByRole("alert")).toContainText(
    "não está configurado",
  );
  await page.getByRole("tab", { name: "Criar conta" }).click();
  await page.getByLabel("Nome completo").fill("Ana Silva");
  await page.getByLabel("Senha", { exact: true }).fill("Senha123");
  await page.getByLabel("Confirmar senha").fill("Senha456");
  await page.getByRole("button", { name: "Criar minha conta" }).click();
  await expect(page.locator(".auth-form").getByRole("alert")).toContainText(
    "iguais",
  );
  await page.getByRole("tab", { name: "Entrar", exact: true }).click();
  await page.getByRole("button", { name: "Esqueceu sua senha?" }).click();
  await expect(
    page.getByRole("heading", { name: "Vamos recuperar seu acesso" }),
  ).toBeVisible();
});
test("layouts sem overflow nas larguras exigidas", async ({ page }) => {
  for (const width of [375, 390, 768, 1024, 1440, 1920]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/");
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await expect(
      page.getByRole("button", { name: "Entrar no AZZO ROOM", exact: true }),
    ).toBeVisible();
    if (width === 390)
      await page.screenshot({
        path: "artifacts/login-mobile.png",
        fullPage: true,
      });
  }
});
test("avatar 3D editável, persistência e escritório", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/avatar?demo=1");
  await expect(page.locator("canvas")).toBeVisible();
  await page.waitForTimeout(2000);
  await page.getByRole("button", { name: "Willow", exact: true }).click();
  await page.getByLabel("Nome exibido").fill("Ana AZZO");
  await page.getByRole("button", { name: "Cabelo", exact: true }).click();
  await page
    .getByRole("button", { name: "Original da base", exact: true })
    .click();
  await page.getByRole("button", { name: "Pele", exact: true }).click();
  await page.getByRole("button", { name: "skin 6", exact: true }).click();
  await page.getByRole("button", { name: "Óculos", exact: true }).click();
  await page.getByRole("button", { name: "Redondo", exact: true }).click();
  await page.getByRole("button", { name: "Roupas", exact: true }).click();
  await page.getByRole("button", { name: "Blazer", exact: true }).click();
  await page.getByRole("button", { name: "Acessórios", exact: true }).click();
  await page.getByRole("button", { name: "Mochila", exact: true }).click();
  await page.getByRole("button", { name: "Correndo", exact: true }).click();
  await page.waitForTimeout(500);
  await page.getByRole("button", { name: "Parado", exact: true }).click();
  await page
    .getByRole("button", { name: "Salvar avatar", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Entrar no escritório", exact: true }),
  ).toBeEnabled();
  await page.screenshot({
    path: "artifacts/avatar-desktop.png",
    fullPage: true,
  });
  await page.reload();
  await expect(page.locator("canvas")).toBeVisible();
  await expect(page.getByLabel("Nome exibido")).toHaveValue("Ana AZZO");
  const profile = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("azzo-room-avatar-v1")!),
  );
  expect(profile).toMatchObject({
    base: "fem",
    hair: 0,
    skin: 5,
    glasses: 1,
    top: 1,
    accessories: [2],
  });
  await page
    .getByRole("button", { name: "Entrar no escritório", exact: true })
    .click();
  await expect(page).toHaveURL(/\/app\?demo=1/);
  await expect(page.locator(".pill.online")).toContainText("Online", {
    timeout: 30000,
  });
  await expect(page.locator("canvas")).toBeVisible();
  await page.keyboard.down("w");
  await page.waitForTimeout(600);
  await page.keyboard.up("w");
  await page.keyboard.press("v");
  await expect(page.locator(".stat-row").last()).toContainText("3ª pessoa");
  await page.screenshot({
    path: "artifacts/office-desktop.png",
    fullPage: true,
  });
  expect(errors).toEqual([]);
});
test("avatar mobile funciona e produção não é presumida", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/avatar?demo=1");
  await expect(page.locator("canvas")).toBeVisible();
  await page
    .getByRole("button", { name: "Salvar avatar", exact: true })
    .click();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "artifacts/avatar-mobile.png",
    fullPage: true,
  });
});
