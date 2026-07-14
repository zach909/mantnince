import { r as TooltipProvider } from "./tooltip-DkH_tb2z.js";
import { HeadContent, Scripts, createFileRoute, createRootRoute, createRouter as createRouter$1, lazyRouteComponent } from "@tanstack/react-router";
import { jsx, jsxs } from "react/jsx-runtime";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
//#region src/components/ui/sonner.tsx
function Toaster$1({ ...props }) {
	return /* @__PURE__ */ jsx(Toaster, {
		theme: "system",
		className: "toaster group",
		style: {
			"--normal-bg": "var(--popover)",
			"--normal-text": "var(--popover-foreground)",
			"--normal-border": "var(--border)"
		},
		...props
	});
}
//#endregion
//#region src/index.css?url
var src_default = "/assets/index-DCMGmamT.css";
//#endregion
//#region src/routes/__root.tsx
/**
* Pre-paint theme script. Runs synchronously in <head> BEFORE first paint, so
* the document renders in the correct theme on the very first frame — no flash.
* Dark mode is a single `.dark` class on <html>; the token values in index.css
* flip under it. Persisted to localStorage, falls back to system preference.
*/
var themeInitScript = `(function(){try{var t=localStorage.getItem('theme');var d=t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme:dark)').matches);document.documentElement.classList.toggle('dark',d);}catch(e){}})();`;
var queryClient = new QueryClient();
/**
* Root route — owns the HTML document (SSR), global <head> (SEO-ready),
* and the app-wide providers.
*
* NO app chrome (sidebar/top bar) is applied here by default, so every app —
* landing pages, marketing sites, content, games — renders FULL-BLEED.
* Building a SaaS / dashboard app? Opt into the sidebar shell by ADDING a
* `src/routes/_app.tsx` pathless layout route with pages under `src/routes/_app/`
* (a `_app.tsx` with no children conflicts with this index route). Keep this
* root bare — don't add chrome here.
*
* SEO/AEO: <HeadContent /> renders the merged head() output (title, meta,
* Open Graph, links) on the server, so crawlers and AI bots receive a
* fully-rendered, indexable document on the first request. Per-page routes
* override title/description via their own head().
*
* SSR: this document (and every route) is server-rendered/prerendered. A child
* that reads browser-only state at render — `blink.auth`/`onAuthStateChanged`,
* `localStorage`, `window` — must be wrapped in `<BlinkClientBoundary>`
* (`src/components/BlinkClientBoundary.tsx`) or use the route's `ssr: false`,
* or the page ships blank / hydration-mismatched. Do NOT read SDK/auth here.
*/
var Route$1 = createRootRoute({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1.0"
			},
			{ title: "Universal Backup Cloud" },
			{
				name: "description",
				content: "All-in-one backup system connecting all your clouds and devices."
			},
			{
				name: "theme-color",
				content: "#1a1d24"
			},
			{
				property: "og:type",
				content: "website"
			},
			{
				property: "og:title",
				content: "Universal Backup Cloud"
			},
			{
				property: "og:description",
				content: "All-in-one backup system connecting all your clouds and devices."
			},
			{
				property: "og:site_name",
				content: "Universal Backup Cloud"
			},
			{
				property: "og:locale",
				content: "en_US"
			},
			{
				name: "twitter:card",
				content: "summary_large_image"
			}
		],
		links: [{
			rel: "stylesheet",
			href: src_default
		}, {
			rel: "icon",
			type: "image/svg+xml",
			href: "/favicon.svg"
		}]
	}),
	shellComponent: RootDocument
});
function RootDocument({ children }) {
	return /* @__PURE__ */ jsxs("html", {
		lang: "en",
		children: [/* @__PURE__ */ jsxs("head", { children: [
			/* @__PURE__ */ jsx("script", { dangerouslySetInnerHTML: { __html: themeInitScript } }),
			/* @__PURE__ */ jsx(HeadContent, {}),
			/* @__PURE__ */ jsx("script", {
				type: "application/ld+json",
				dangerouslySetInnerHTML: { __html: JSON.stringify({
					"@context": "https://schema.org",
					"@graph": [{
						"@type": "WebSite",
						name: "Blink App",
						url: "/"
					}, {
						"@type": "Organization",
						name: "Blink App",
						url: "/",
						sameAs: []
					}]
				}) }
			}),
			/* @__PURE__ */ jsx("script", {
				src: "https://blink.new/widget.js?projectId=universal-backup-cloud-z5r6fno8",
				type: "module"
			})
		] }), /* @__PURE__ */ jsxs("body", { children: [/* @__PURE__ */ jsx(QueryClientProvider, {
			client: queryClient,
			children: /* @__PURE__ */ jsxs(TooltipProvider, {
				delayDuration: 0,
				children: [/* @__PURE__ */ jsx(Toaster$1, {}), children]
			})
		}), /* @__PURE__ */ jsx(Scripts, {})] })]
	});
}
//#endregion
//#region src/routes/index.tsx
var $$splitComponentImporter = () => import("./routes-BEN0sepm.js");
//#endregion
//#region src/routeTree.gen.ts
var rootRouteChildren = { IndexRoute: createFileRoute("/")({
	head: () => ({ meta: [{ title: "Dashboard · Universal Backup Cloud" }, {
		name: "description",
		content: "Monitor your universal cloud backups, storage, and earnings."
	}] }),
	component: lazyRouteComponent($$splitComponentImporter, "component")
}).update({
	id: "/",
	path: "/",
	getParentRoute: () => Route$1
}) };
var routeTree = Route$1._addFileChildren(rootRouteChildren)._addFileTypes();
//#endregion
//#region src/router.tsx
/**
* TanStack Start entry — the framework imports this `createRouter` factory.
* `routeTree.gen.ts` is generated automatically by the TanStack Start Vite
* plugin from the files under `src/routes/` (do not edit it by hand).
*/
function createRouter() {
	return createRouter$1({
		routeTree,
		defaultPreload: "intent",
		scrollRestoration: true
	});
}
var getRouter = createRouter;
//#endregion
export { createRouter, getRouter };
