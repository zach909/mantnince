import { a as cn, i as TooltipTrigger, n as TooltipContent, r as TooltipProvider, t as Tooltip } from "./tooltip-DkH_tb2z.js";
import React, { createContext, useCallback, useState } from "react";
import { ClientOnly } from "@tanstack/react-router";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { useQuery } from "@tanstack/react-query";
import { Apple, Cloud, Database, DollarSign, ExternalLink, FileText, Globe, HardDrive, LayoutDashboard, LogOut, Menu, Monitor, PanelLeft, Play, Plus, RefreshCw, Settings, Shield, Smartphone, TrendingDown, TrendingUp, XIcon } from "lucide-react";
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import * as SheetPrimitive from "@radix-ui/react-dialog";
import * as AvatarPrimitive from "@radix-ui/react-avatar";
import { createClient } from "@blinkdotnew/sdk";
//#region src/components/ui/button.tsx
var buttonVariants = cva("inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive", {
	variants: {
		variant: {
			default: "bg-primary text-primary-foreground shadow-xs hover:bg-primary/90",
			destructive: "bg-destructive text-white shadow-xs hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
			outline: "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50",
			secondary: "bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80",
			ghost: "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
			link: "text-primary underline-offset-4 hover:underline"
		},
		size: {
			default: "h-9 px-4 py-2 has-[>svg]:px-3",
			sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
			lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
			icon: "size-9"
		}
	},
	defaultVariants: {
		variant: "default",
		size: "default"
	}
});
function Button({ className, variant, size, asChild = false, ...props }) {
	return /* @__PURE__ */ jsx(asChild ? Slot : "button", {
		"data-slot": "button",
		className: cn(buttonVariants({
			variant,
			size,
			className
		})),
		...props
	});
}
//#endregion
//#region src/components/ui/sheet.tsx
function Sheet({ ...props }) {
	return /* @__PURE__ */ jsx(SheetPrimitive.Root, {
		"data-slot": "sheet",
		...props
	});
}
function SheetPortal({ ...props }) {
	return /* @__PURE__ */ jsx(SheetPrimitive.Portal, {
		"data-slot": "sheet-portal",
		...props
	});
}
function SheetOverlay({ className, ...props }) {
	return /* @__PURE__ */ jsx(SheetPrimitive.Overlay, {
		"data-slot": "sheet-overlay",
		className: cn("data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50", className),
		...props
	});
}
function SheetContent({ className, children, side = "right", ...props }) {
	return /* @__PURE__ */ jsxs(SheetPortal, { children: [/* @__PURE__ */ jsx(SheetOverlay, {}), /* @__PURE__ */ jsxs(SheetPrimitive.Content, {
		"data-slot": "sheet-content",
		className: cn("bg-background data-[state=open]:animate-in data-[state=closed]:animate-out fixed z-50 flex flex-col gap-4 shadow-lg transition ease-in-out data-[state=closed]:duration-300 data-[state=open]:duration-500", side === "right" && "data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right inset-y-0 right-0 h-full w-3/4 border-l sm:max-w-sm", side === "left" && "data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left inset-y-0 left-0 h-full w-3/4 border-r sm:max-w-sm", side === "top" && "data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top inset-x-0 top-0 h-auto border-b", side === "bottom" && "data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom inset-x-0 bottom-0 h-auto border-t", className),
		...props,
		children: [children, /* @__PURE__ */ jsxs(SheetPrimitive.Close, {
			className: "ring-offset-background focus:ring-ring data-[state=open]:bg-secondary absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none",
			children: [/* @__PURE__ */ jsx(XIcon, { className: "size-4" }), /* @__PURE__ */ jsx("span", {
				className: "sr-only",
				children: "Close"
			})]
		})]
	})] });
}
//#endregion
//#region src/Shell.tsx
/**
* Shell — Mobile-responsive app layout (shadcn/ui based).
*
* USAGE (in a route or SharedAppLayout):
*   <Shell sidebar={<MySidebarContent />}>
*     <Page>...</Page>
*   </Shell>
*
* Desktop (md+): the sidebar is a fixed column on the left, main content fills
* the rest. Mobile: the sidebar is hidden and opens in a Sheet drawer via the
* hamburger button in the mobile header. Customize freely — this is your code.
*/
function Shell({ sidebar, appName = "App", children }) {
	const [open, setOpen] = useState(false);
	return /* @__PURE__ */ jsxs("div", {
		className: "flex min-h-dvh",
		children: [
			/* @__PURE__ */ jsx("aside", {
				className: "hidden md:block shrink-0",
				children: sidebar
			}),
			/* @__PURE__ */ jsx(Sheet, {
				open,
				onOpenChange: setOpen,
				children: /* @__PURE__ */ jsx(SheetContent, {
					side: "left",
					className: "w-64 p-0",
					children: sidebar
				})
			}),
			/* @__PURE__ */ jsxs("main", {
				className: "flex flex-1 min-w-0 flex-col",
				children: [/* @__PURE__ */ jsxs("div", {
					className: "md:hidden flex items-center gap-3 px-4 h-14 border-b border-border bg-background sticky top-0 z-30",
					children: [/* @__PURE__ */ jsx(Button, {
						variant: "ghost",
						size: "icon",
						className: "-ml-2",
						"aria-label": "Open menu",
						onClick: () => setOpen(true),
						children: /* @__PURE__ */ jsx(Menu, { className: "size-5" })
					}), /* @__PURE__ */ jsx("span", {
						className: "font-semibold text-sm",
						children: appName
					})]
				}), children]
			})
		]
	});
}
//#endregion
//#region src/components/ui/avatar.tsx
function Avatar({ className, ...props }) {
	return /* @__PURE__ */ jsx(AvatarPrimitive.Root, {
		"data-slot": "avatar",
		className: cn("relative flex size-8 shrink-0 overflow-hidden rounded-full", className),
		...props
	});
}
function AvatarFallback({ className, ...props }) {
	return /* @__PURE__ */ jsx(AvatarPrimitive.Fallback, {
		"data-slot": "avatar-fallback",
		className: cn("bg-muted flex size-full items-center justify-center rounded-full", className),
		...props
	});
}
//#endregion
//#region src/components/AppSidebarShell.tsx
/**
* Collapsible SaaS sidebar — OPT-IN (rendered by SharedAppLayout, which the
* template root does NOT apply by default). Only reach for this when building a
* SaaS / dashboard app; landing & marketing pages stay full-bleed.
*
* Expands to 15rem, collapses to 3rem (icon-only).
* State is persisted to localStorage. Tooltips appear automatically when collapsed.
*
* A native flex-col implementation (shadcn Button/Avatar/Tooltip primitives) for
* full layout control — every line is yours to edit.
*/
var SIDEBAR_KEY = "sidebar_collapsed";
var NAV_ITEMS = [
	{
		href: "/",
		icon: /* @__PURE__ */ jsx(LayoutDashboard, { className: "h-4 w-4" }),
		label: "Dashboard",
		active: true
	},
	{
		href: "/items",
		icon: /* @__PURE__ */ jsx(FileText, { className: "h-4 w-4" }),
		label: "Items"
	},
	{
		href: "/settings",
		icon: /* @__PURE__ */ jsx(Settings, { className: "h-4 w-4" }),
		label: "Settings"
	}
];
function NavItem({ item, collapsed }) {
	const link = /* @__PURE__ */ jsxs("a", {
		href: item.href,
		className: cn("flex items-center gap-2.5 rounded-md text-sm transition-colors cursor-pointer", collapsed ? "justify-center w-8 h-8 mx-auto" : "px-3 py-2 w-full", item.active ? "bg-accent text-foreground font-medium" : "text-muted-foreground hover:bg-accent hover:text-foreground"),
		children: [/* @__PURE__ */ jsx("span", {
			className: "shrink-0",
			children: item.icon
		}), !collapsed && /* @__PURE__ */ jsx("span", {
			className: "truncate",
			children: item.label
		})]
	});
	if (!collapsed) return link;
	return /* @__PURE__ */ jsxs(Tooltip, { children: [/* @__PURE__ */ jsx(TooltipTrigger, {
		asChild: true,
		children: link
	}), /* @__PURE__ */ jsx(TooltipContent, {
		side: "right",
		children: item.label
	})] });
}
function AppSidebarShell() {
	const [collapsed, setCollapsed] = useState(() => {
		if (typeof window === "undefined") return false;
		return localStorage.getItem(SIDEBAR_KEY) === "true";
	});
	const toggle = useCallback(() => {
		setCollapsed((v) => {
			const next = !v;
			localStorage.setItem(SIDEBAR_KEY, String(next));
			return next;
		});
	}, []);
	return /* @__PURE__ */ jsx(TooltipProvider, {
		delayDuration: 0,
		children: /* @__PURE__ */ jsxs("div", {
			className: cn("flex flex-col h-full bg-background border-r border-border overflow-hidden", "transition-[width] duration-200 ease-linear shrink-0", collapsed ? "w-[3rem]" : "w-[15rem]"),
			children: [
				/* @__PURE__ */ jsxs("div", {
					className: cn("flex items-center gap-2 shrink-0 border-b border-border h-[52px] px-3", collapsed && "justify-center px-2"),
					children: [!collapsed && /* @__PURE__ */ jsxs(Fragment, { children: [/* @__PURE__ */ jsx("div", {
						className: "flex items-center justify-center h-7 w-7 rounded-md bg-primary text-primary-foreground text-xs font-bold shrink-0",
						children: "A"
					}), /* @__PURE__ */ jsx("span", {
						className: "flex-1 font-semibold text-sm truncate",
						children: "App"
					})] }), /* @__PURE__ */ jsxs(Tooltip, { children: [/* @__PURE__ */ jsx(TooltipTrigger, {
						asChild: true,
						children: /* @__PURE__ */ jsx(Button, {
							variant: "ghost",
							size: "sm",
							className: "h-7 w-7 p-0 shrink-0 text-muted-foreground hover:text-foreground",
							onClick: toggle,
							children: /* @__PURE__ */ jsx(PanelLeft, { className: cn("h-4 w-4 transition-transform duration-200", collapsed && "rotate-180") })
						})
					}), /* @__PURE__ */ jsx(TooltipContent, {
						side: "right",
						children: collapsed ? "Expand sidebar" : "Collapse sidebar"
					})] })]
				}),
				/* @__PURE__ */ jsxs("div", {
					className: "flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-2 py-2 space-y-0.5",
					children: [!collapsed && /* @__PURE__ */ jsx("p", {
						className: "px-3 pt-1 pb-1 text-[10px] font-medium text-muted-foreground uppercase tracking-wider",
						children: "Main"
					}), NAV_ITEMS.map((item) => /* @__PURE__ */ jsx(NavItem, {
						item,
						collapsed
					}, item.href))]
				}),
				/* @__PURE__ */ jsxs("div", {
					className: cn("shrink-0 border-t border-border", collapsed ? "flex flex-col items-center gap-1 p-2" : "p-3 space-y-1"),
					children: [collapsed ? /* @__PURE__ */ jsxs(Tooltip, { children: [/* @__PURE__ */ jsx(TooltipTrigger, {
						asChild: true,
						children: /* @__PURE__ */ jsx("button", {
							className: "flex items-center justify-center h-8 w-8 rounded-md hover:bg-accent transition-colors cursor-pointer",
							children: /* @__PURE__ */ jsx(Avatar, {
								className: "h-6 w-6 shrink-0",
								children: /* @__PURE__ */ jsx(AvatarFallback, {
									className: "text-[10px] bg-muted",
									children: "U"
								})
							})
						})
					}), /* @__PURE__ */ jsx(TooltipContent, {
						side: "right",
						children: "User · user@example.com"
					})] }) : /* @__PURE__ */ jsxs("button", {
						className: "flex items-center gap-2 rounded-md hover:bg-accent transition-colors cursor-pointer w-full px-2 py-1.5",
						children: [/* @__PURE__ */ jsx(Avatar, {
							className: "h-6 w-6 shrink-0",
							children: /* @__PURE__ */ jsx(AvatarFallback, {
								className: "text-[10px] bg-muted",
								children: "U"
							})
						}), /* @__PURE__ */ jsxs("div", {
							className: "flex-1 min-w-0 text-left",
							children: [/* @__PURE__ */ jsx("p", {
								className: "text-xs font-medium leading-tight truncate",
								children: "User"
							}), /* @__PURE__ */ jsx("p", {
								className: "text-[10px] text-muted-foreground leading-tight truncate",
								children: "user@example.com"
							})]
						})]
					}), collapsed ? /* @__PURE__ */ jsxs(Tooltip, { children: [/* @__PURE__ */ jsx(TooltipTrigger, {
						asChild: true,
						children: /* @__PURE__ */ jsx(Button, {
							type: "button",
							variant: "ghost",
							size: "sm",
							className: "h-8 w-8 p-0 text-muted-foreground hover:text-foreground",
							children: /* @__PURE__ */ jsx(LogOut, { className: "h-4 w-4 shrink-0" })
						})
					}), /* @__PURE__ */ jsx(TooltipContent, {
						side: "right",
						children: "Sign out"
					})] }) : /* @__PURE__ */ jsxs(Button, {
						type: "button",
						variant: "ghost",
						size: "sm",
						className: "w-full justify-start px-2 gap-2 text-muted-foreground hover:text-foreground",
						children: [/* @__PURE__ */ jsx(LogOut, { className: "h-4 w-4 shrink-0" }), "Sign out"]
					})]
				})
			]
		})
	});
}
//#endregion
//#region src/layouts/shared-app-layout.tsx
/**
* SaaS app chrome (sidebar + main) — OPT-IN, not the default.
* The template root (__root.tsx) is full-bleed by default. To use this, ADD a
* `src/routes/_app.tsx` pathless layout route that renders <SharedAppLayout>
* and wrap pages under `src/routes/_app/` in it — give it children, since a
* childless `_app.tsx` collides with the root index route. Do not wrap
* individual pages in Shell or duplicate sidebars/top bars. Landing/marketing/
* content apps don't need this at all.
*/
var SharedLayoutContext = createContext(null);
function SharedAppLayout({ appName = "App", sidebar = /* @__PURE__ */ jsx(AppSidebarShell, {}), children }) {
	const value = React.useMemo(() => ({ appName }), [appName]);
	return /* @__PURE__ */ jsx(SharedLayoutContext.Provider, {
		value,
		children: /* @__PURE__ */ jsx("div", {
			className: "flex min-h-dvh w-full flex-1 flex-col",
			children: /* @__PURE__ */ jsx(Shell, {
				appName,
				sidebar,
				children
			})
		})
	});
}
//#endregion
//#region src/components/BlinkClientBoundary.tsx
/**
* SSR-safe boundary. Every route in this template is SERVER-RENDERED / prerendered
* (TanStack Start). Anything that touches the browser AT RENDER TIME — Blink SDK
* auth state (`blink.auth`, `onAuthStateChanged`), `localStorage`/`window`, or a
* hook that reads them — throws or hydration-mismatches on the server and ships a
* blank/broken first page. Wrap that subtree here: the server renders `fallback`,
* and the real UI mounts in the browser. Keep static/marketing content OUTSIDE the
* boundary so it stays server-rendered and crawlable.
*
*   <BlinkClientBoundary fallback={<Skeleton />}>
*     <AuthedDashboard />   // reads blink.auth — browser only
*   </BlinkClientBoundary>
*
* If the WHOLE page needs the browser, prefer `ssr: false` on the route instead:
* `createFileRoute('/path')({ ssr: false, component })`.
*/
function BlinkClientBoundary({ children, fallback = null }) {
	return /* @__PURE__ */ jsx(ClientOnly, { fallback });
}
//#endregion
//#region src/components/dashboard/StatsCard.tsx
function StatsCard({ icon, label, value, subtext, trend }) {
	return /* @__PURE__ */ jsxs("div", {
		className: cn("group rounded-xl border border-border bg-card p-4", "transition-all duration-200", "hover:-translate-y-0.5 hover:shadow-md hover:border-border/80"),
		children: [/* @__PURE__ */ jsxs("div", {
			className: "flex items-start justify-between",
			children: [/* @__PURE__ */ jsx("div", {
				className: "flex size-9 items-center justify-center rounded-lg bg-muted/60 text-muted-foreground",
				children: icon
			}), trend && trend !== "neutral" && /* @__PURE__ */ jsx("div", {
				className: cn("flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-medium", trend === "up" ? "bg-chart-2/15 text-chart-2" : "bg-destructive/15 text-destructive"),
				children: trend === "up" ? /* @__PURE__ */ jsx(TrendingUp, { className: "size-3" }) : /* @__PURE__ */ jsx(TrendingDown, { className: "size-3" })
			})]
		}), /* @__PURE__ */ jsxs("div", {
			className: "mt-3 space-y-1",
			children: [
				/* @__PURE__ */ jsx("p", {
					className: "text-xs text-muted-foreground",
					children: label
				}),
				/* @__PURE__ */ jsx("p", {
					className: "text-xl font-semibold tracking-tight text-foreground",
					children: value
				}),
				subtext && /* @__PURE__ */ jsx("p", {
					className: "text-xs text-muted-foreground/80",
					children: subtext
				})
			]
		})]
	});
}
//#endregion
//#region src/components/dashboard/CloudCard.tsx
function CloudCard({ name, icon, connected, filesCount, lastSync, onConnect }) {
	return /* @__PURE__ */ jsxs("div", {
		className: cn("rounded-xl border border-border bg-card p-5", "transition-all duration-200", "hover:-translate-y-0.5 hover:shadow-md hover:border-border/80"),
		children: [
			/* @__PURE__ */ jsxs("div", {
				className: "flex items-center gap-3",
				children: [
					/* @__PURE__ */ jsx("div", {
						className: cn("flex size-10 items-center justify-center rounded-lg", connected ? "bg-chart-4/15 text-chart-4" : "bg-muted/60 text-muted-foreground"),
						children: icon
					}),
					/* @__PURE__ */ jsxs("div", {
						className: "flex-1 min-w-0",
						children: [/* @__PURE__ */ jsx("p", {
							className: "text-sm font-medium text-foreground truncate",
							children: name
						}), /* @__PURE__ */ jsx("p", {
							className: cn("text-xs font-medium", connected ? "text-chart-4" : "text-muted-foreground"),
							children: connected ? "Connected" : "Not connected"
						})]
					}),
					/* @__PURE__ */ jsx("div", { className: cn("size-2.5 rounded-full", connected ? "bg-chart-4 shadow-[0_0_6px_var(--color-chart-4)]" : "bg-muted-foreground/30") })
				]
			}),
			connected && /* @__PURE__ */ jsxs("div", {
				className: "mt-4 space-y-2 border-t border-border pt-4",
				children: [
					/* @__PURE__ */ jsxs("div", {
						className: "flex items-center justify-between text-xs",
						children: [/* @__PURE__ */ jsxs("span", {
							className: "text-muted-foreground flex items-center gap-1.5",
							children: [/* @__PURE__ */ jsx(Shield, { className: "size-3" }), "Files synced"]
						}), /* @__PURE__ */ jsx("span", {
							className: "font-medium text-foreground tabular-nums",
							children: filesCount.toLocaleString()
						})]
					}),
					lastSync && /* @__PURE__ */ jsxs("div", {
						className: "flex items-center justify-between text-xs",
						children: [/* @__PURE__ */ jsxs("span", {
							className: "text-muted-foreground flex items-center gap-1.5",
							children: [/* @__PURE__ */ jsx(RefreshCw, { className: "size-3" }), "Last sync"]
						}), /* @__PURE__ */ jsx("span", {
							className: "font-medium text-foreground",
							children: lastSync
						})]
					}),
					/* @__PURE__ */ jsxs(Button, {
						variant: "ghost",
						size: "sm",
						className: "mt-2 w-full justify-start gap-2 text-xs text-muted-foreground hover:text-foreground",
						children: [/* @__PURE__ */ jsx(ExternalLink, { className: "size-3" }), "Browse files"]
					})
				]
			}),
			!connected && /* @__PURE__ */ jsxs(Button, {
				variant: "outline",
				size: "sm",
				onClick: onConnect,
				className: "mt-4 w-full gap-2 text-xs",
				children: [
					/* @__PURE__ */ jsx(Plus, { className: "size-3" }),
					"Connect ",
					name
				]
			})
		]
	});
}
//#endregion
//#region src/components/dashboard/BackupTable.tsx
function formatBytes(bytes) {
	if (bytes === 0) return "0 B";
	const units = [
		"B",
		"KB",
		"MB",
		"GB"
	];
	const i = Math.floor(Math.log(bytes) / Math.log(1024));
	return `${(bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0)} ${units[i]}`;
}
function truncateUrl(url, max = 38) {
	return url.length > max ? `${url.slice(0, max)}...` : url;
}
function BackupTable({ backups }) {
	if (backups.length === 0) return /* @__PURE__ */ jsxs("div", {
		className: "flex flex-col items-center justify-center rounded-xl border border-border bg-card px-6 py-12",
		children: [
			/* @__PURE__ */ jsx(FileText, { className: "size-8 text-muted-foreground/40" }),
			/* @__PURE__ */ jsx("p", {
				className: "mt-3 text-sm font-medium text-muted-foreground",
				children: "No backup captures yet"
			}),
			/* @__PURE__ */ jsx("p", {
				className: "mt-1 text-xs text-muted-foreground/60",
				children: "Captured files will appear here once backups start running."
			})
		]
	});
	return /* @__PURE__ */ jsx("div", {
		className: "overflow-hidden rounded-xl border border-border bg-card",
		children: /* @__PURE__ */ jsx("div", {
			className: "overflow-x-auto",
			children: /* @__PURE__ */ jsxs("table", {
				className: "w-full text-left text-sm",
				children: [/* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", {
					className: "border-b border-border bg-muted/40",
					children: [
						/* @__PURE__ */ jsx("th", {
							className: "px-5 py-3 text-xs font-medium text-muted-foreground",
							children: "File"
						}),
						/* @__PURE__ */ jsx("th", {
							className: "px-5 py-3 text-xs font-medium text-muted-foreground",
							children: "Source URL"
						}),
						/* @__PURE__ */ jsx("th", {
							className: "px-5 py-3 text-xs font-medium text-muted-foreground",
							children: "Size"
						}),
						/* @__PURE__ */ jsx("th", {
							className: "px-5 py-3 text-xs font-medium text-muted-foreground",
							children: "Saved"
						}),
						/* @__PURE__ */ jsx("th", {
							className: "px-5 py-3 text-xs font-medium text-muted-foreground",
							children: "Date"
						})
					]
				}) }), /* @__PURE__ */ jsx("tbody", { children: backups.map((b) => /* @__PURE__ */ jsxs("tr", {
					className: "border-b border-border/60 transition-colors hover:bg-muted/30 last:border-b-0",
					children: [
						/* @__PURE__ */ jsx("td", {
							className: "px-5 py-3.5",
							children: /* @__PURE__ */ jsxs("div", {
								className: "flex items-center gap-2",
								children: [/* @__PURE__ */ jsx(FileText, { className: "size-3.5 shrink-0 text-muted-foreground" }), /* @__PURE__ */ jsx("span", {
									className: "font-medium text-foreground truncate max-w-[140px]",
									children: b.filename
								})]
							})
						}),
						/* @__PURE__ */ jsx("td", {
							className: "px-5 py-3.5",
							children: /* @__PURE__ */ jsxs("a", {
								href: b.url,
								target: "_blank",
								rel: "noopener noreferrer",
								className: "inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors",
								children: [truncateUrl(b.url), /* @__PURE__ */ jsx(ExternalLink, { className: "size-3 shrink-0" })]
							})
						}),
						/* @__PURE__ */ jsx("td", {
							className: "px-5 py-3.5 text-xs text-muted-foreground tabular-nums",
							children: formatBytes(b.fileSize)
						}),
						/* @__PURE__ */ jsx("td", {
							className: "px-5 py-3.5",
							children: b.storageSaved > 0 ? /* @__PURE__ */ jsxs("span", {
								className: "inline-flex items-center gap-1 rounded-full bg-chart-4/15 px-2 py-0.5 text-xs font-medium text-chart-4",
								children: [/* @__PURE__ */ jsx(Shield, { className: "size-3" }), formatBytes(b.storageSaved)]
							}) : /* @__PURE__ */ jsx("span", {
								className: "text-xs text-muted-foreground",
								children: "—"
							})
						}),
						/* @__PURE__ */ jsx("td", {
							className: "px-5 py-3.5 text-xs text-muted-foreground tabular-nums whitespace-nowrap",
							children: new Date(b.createdAt).toLocaleDateString("en-US", {
								month: "short",
								day: "numeric",
								year: "numeric"
							})
						})
					]
				}, b.id)) })]
			})
		})
	});
}
//#endregion
//#region src/components/dashboard/EarningsPanel.tsx
function MetricRow({ icon, label, value }) {
	return /* @__PURE__ */ jsxs("div", {
		className: "flex items-center justify-between py-2.5 first:pt-0 last:pb-0",
		children: [/* @__PURE__ */ jsxs("span", {
			className: "flex items-center gap-2 text-xs text-muted-foreground",
			children: [icon, label]
		}), /* @__PURE__ */ jsx("span", {
			className: "text-xs font-medium text-foreground tabular-nums",
			children: value
		})]
	});
}
function EarningsPanel({ earnings, onWatchAd }) {
	const hasEarnings = earnings !== null;
	return /* @__PURE__ */ jsxs("div", {
		className: "rounded-xl border border-border bg-card p-5",
		children: [
			/* @__PURE__ */ jsxs("div", {
				className: "flex items-center gap-2.5",
				children: [/* @__PURE__ */ jsx("div", {
					className: "flex size-9 items-center justify-center rounded-lg bg-chart-5/15 text-chart-5",
					children: /* @__PURE__ */ jsx(DollarSign, { className: "size-4" })
				}), /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("p", {
					className: "text-sm font-medium text-foreground",
					children: "Ad earnings"
				}), /* @__PURE__ */ jsx("p", {
					className: "text-xs text-muted-foreground",
					children: hasEarnings ? `${earnings.adsWatched} ads watched` : "Start earning"
				})] })]
			}),
			hasEarnings && /* @__PURE__ */ jsxs("div", {
				className: "mt-4 divide-y divide-border/60",
				children: [
					/* @__PURE__ */ jsx(MetricRow, {
						icon: /* @__PURE__ */ jsx(DollarSign, { className: "size-3.5" }),
						label: "Total earned",
						value: `$${earnings.totalEarned.toFixed(2)}`
					}),
					/* @__PURE__ */ jsx(MetricRow, {
						icon: /* @__PURE__ */ jsx(HardDrive, { className: "size-3.5" }),
						label: "Storage earned",
						value: `${earnings.storageEarnedGb.toFixed(1)} GB`
					}),
					/* @__PURE__ */ jsx(MetricRow, {
						icon: /* @__PURE__ */ jsx(TrendingUp, { className: "size-3.5" }),
						label: "Cash available",
						value: `$${earnings.cashAvailable.toFixed(2)}`
					})
				]
			}),
			!hasEarnings && /* @__PURE__ */ jsx("p", {
				className: "mt-4 text-xs text-muted-foreground/70 leading-relaxed",
				children: "Watch short ads to earn free storage for your backups. No purchase required."
			}),
			/* @__PURE__ */ jsxs(Button, {
				variant: "default",
				size: "sm",
				onClick: onWatchAd,
				className: "mt-4 w-full gap-2 text-xs font-medium",
				children: [/* @__PURE__ */ jsx(Play, { className: "size-3.5" }), "Watch ad to earn storage"]
			})
		]
	});
}
//#endregion
//#region src/blink/client.ts
var blink = createClient({
	projectId: "universal-backup-cloud-z5r6fno8",
	publishableKey: "blnk_pk_q0sxmefzESB184cc41gFz3AIvcSczIzT",
	auth: { mode: "managed" }
});
//#endregion
//#region src/hooks/useBackupData.ts
var backupKeys = {
	captures: ["backup-captures"],
	connections: ["cloud-connections"],
	devices: ["devices"],
	earnings: ["ad-earnings"],
	stats: ["backup-stats"]
};
var GB = 1024 ** 3;
/** Alias: most recent backup captures for the dashboard. */
function useRecentBackups() {
	return useQuery({
		queryKey: [...backupKeys.captures, "recent"],
		queryFn: () => blink.db.table("backup_captures").list({
			orderBy: { createdAt: "desc" },
			limit: 20
		})
	});
}
/** Aggregate cloud status (google/apple/microsoft with connected flag + file count). */
function useCloudStatus() {
	return useQuery({
		queryKey: [...backupKeys.connections, "status"],
		queryFn: async () => {
			const rows = await blink.db.table("cloud_connections").list();
			const find = (p) => rows.find((r) => r.provider === p);
			return {
				google: {
					connected: Number(find("google")?.connected ?? 0) > 0,
					lastSync: find("google")?.lastSync ?? null,
					filesCount: find("google")?.filesCount ?? 0
				},
				apple: {
					connected: Number(find("apple")?.connected ?? 0) > 0,
					lastSync: find("apple")?.lastSync ?? null,
					filesCount: find("apple")?.filesCount ?? 0
				},
				microsoft: {
					connected: Number(find("microsoft")?.connected ?? 0) > 0,
					lastSync: find("microsoft")?.lastSync ?? null,
					filesCount: find("microsoft")?.filesCount ?? 0
				}
			};
		}
	});
}
/** Count online devices. */
function useDeviceCount() {
	return useQuery({
		queryKey: [...backupKeys.devices, "count"],
		queryFn: async () => {
			return (await blink.db.table("devices").list()).filter((d) => d.status === "online").length;
		}
	});
}
/** Fetch the current user's ad-earnings row, or `null` if none exists. */
function useAdEarnings() {
	return useQuery({
		queryKey: backupKeys.earnings,
		queryFn: async () => {
			return (await blink.db.table("ad_earnings").list({ limit: 1 }))[0] ?? null;
		}
	});
}
/** Alias for dashboard: ad earnings. */
function useEarnings() {
	return useAdEarnings();
}
/** Compute aggregate stats from the backup_captures table. */
function useBackupStats() {
	return useQuery({
		queryKey: backupKeys.stats,
		queryFn: async () => {
			const captures = await blink.db.table("backup_captures").list({ orderBy: { createdAt: "desc" } });
			const totalBackups = captures.length;
			const totalSizeGb = captures.reduce((sum, c) => sum + (c.fileSize || 0), 0) / GB;
			const storageSavedGb = captures.filter((c) => Number(c.storageSaved)).reduce((sum, c) => sum + (c.fileSize || 0), 0) / GB;
			const dedupCount = captures.filter((c) => c.duplicateOf).length;
			return {
				totalBackups,
				totalSizeGb,
				storageSavedGb,
				dedupRate: totalBackups > 0 ? dedupCount / totalBackups : 0,
				lastBackup: captures[0]?.createdAt ?? null
			};
		}
	});
}
//#endregion
//#region src/routes/_app/index.tsx
function formatGb(val) {
	return `${val.toFixed(1)} GB`;
}
function formatDedup(rate) {
	return `${rate.toFixed(0)}% dedup`;
}
function formatSyncDate(iso) {
	if (!iso) return null;
	const diffMin = Math.floor((Date.now() - new Date(iso).getTime()) / 6e4);
	if (diffMin < 1) return "Just now";
	if (diffMin < 60) return `${diffMin} min ago`;
	const diffHrs = Math.floor(diffMin / 60);
	if (diffHrs < 24) return `${diffHrs} hr ago`;
	return new Date(iso).toLocaleDateString("en-US", {
		month: "short",
		day: "numeric"
	});
}
function DashboardPage() {
	const { data: stats } = useBackupStats();
	const { data: backups } = useRecentBackups();
	const { data: earnings } = useEarnings();
	const { data: cloudStatus } = useCloudStatus();
	const { data: deviceCount } = useDeviceCount();
	const connectedClouds = cloudStatus ? [
		cloudStatus.google,
		cloudStatus.apple,
		cloudStatus.microsoft
	].filter((c) => c.connected).length : 0;
	const handleConnect = (provider) => {
		console.info(`Connect ${provider}`);
	};
	const handleWatchAd = () => {
		console.info("Watch ad");
	};
	return /* @__PURE__ */ jsxs("div", {
		className: "animate-fade-in space-y-6 p-6",
		children: [
			/* @__PURE__ */ jsxs("div", {
				className: "flex flex-col gap-1",
				children: [/* @__PURE__ */ jsx("h1", {
					className: "text-xl font-semibold tracking-tight text-foreground",
					children: "Universal Backup Cloud"
				}), /* @__PURE__ */ jsx("p", {
					className: "text-sm text-muted-foreground",
					children: "Dashboard"
				})]
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4",
				children: [
					/* @__PURE__ */ jsx(StatsCard, {
						icon: /* @__PURE__ */ jsx(HardDrive, { className: "size-4" }),
						label: "Total backups",
						value: stats ? String(stats.totalBackups) : "—",
						subtext: stats?.lastBackup ? `Last: ${formatSyncDate(stats.lastBackup)}` : void 0
					}),
					/* @__PURE__ */ jsx(StatsCard, {
						icon: /* @__PURE__ */ jsx(Database, { className: "size-4" }),
						label: "Storage saved",
						value: stats ? formatGb(stats.storageSavedGb) : "—",
						subtext: stats ? formatDedup(stats.dedupRate) : void 0,
						trend: "up"
					}),
					/* @__PURE__ */ jsx(StatsCard, {
						icon: /* @__PURE__ */ jsx(Cloud, { className: "size-4" }),
						label: "Connected clouds",
						value: `${connectedClouds}/3`,
						subtext: "Providers online"
					}),
					/* @__PURE__ */ jsx(StatsCard, {
						icon: /* @__PURE__ */ jsx(Smartphone, { className: "size-4" }),
						label: "Devices online",
						value: deviceCount !== void 0 ? String(deviceCount) : "—",
						subtext: "Active devices"
					})
				]
			}),
			/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("h2", {
				className: "mb-3 text-sm font-semibold text-foreground",
				children: "Cloud connections"
			}), /* @__PURE__ */ jsxs("div", {
				className: "grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3",
				children: [
					/* @__PURE__ */ jsx(CloudCard, {
						provider: "google",
						name: "Google Drive",
						icon: /* @__PURE__ */ jsx(Globe, { className: "size-5" }),
						connected: cloudStatus?.google.connected ?? false,
						filesCount: cloudStatus?.google.filesCount ?? 0,
						lastSync: cloudStatus ? formatSyncDate(cloudStatus.google.lastSync) : null,
						onConnect: () => handleConnect("google")
					}),
					/* @__PURE__ */ jsx(CloudCard, {
						provider: "apple",
						name: "iCloud",
						icon: /* @__PURE__ */ jsx(Apple, { className: "size-5" }),
						connected: cloudStatus?.apple.connected ?? false,
						filesCount: cloudStatus?.apple.filesCount ?? 0,
						lastSync: cloudStatus ? formatSyncDate(cloudStatus.apple.lastSync) : null,
						onConnect: () => handleConnect("apple")
					}),
					/* @__PURE__ */ jsx(CloudCard, {
						provider: "microsoft",
						name: "OneDrive",
						icon: /* @__PURE__ */ jsx(Monitor, { className: "size-5" }),
						connected: cloudStatus?.microsoft.connected ?? false,
						filesCount: cloudStatus?.microsoft.filesCount ?? 0,
						lastSync: cloudStatus ? formatSyncDate(cloudStatus.microsoft.lastSync) : null,
						onConnect: () => handleConnect("microsoft")
					})
				]
			})] }),
			/* @__PURE__ */ jsxs("div", {
				className: "grid grid-cols-1 gap-6 xl:grid-cols-[1fr_320px]",
				children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("h2", {
					className: "mb-3 text-sm font-semibold text-foreground",
					children: "Recent backup captures"
				}), /* @__PURE__ */ jsx(BackupTable, { backups: backups ?? [] })] }), /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("h2", {
					className: "mb-3 text-sm font-semibold text-foreground",
					children: "Earnings"
				}), /* @__PURE__ */ jsx(EarningsPanel, {
					earnings: earnings ?? null,
					onWatchAd: handleWatchAd
				})] })]
			})
		]
	});
}
//#endregion
//#region src/routes/index.tsx?tsr-split=component
function Home() {
	return /* @__PURE__ */ jsx(BlinkClientBoundary, {
		fallback: /* @__PURE__ */ jsx("div", {
			className: "flex min-h-dvh items-center justify-center bg-background",
			children: /* @__PURE__ */ jsxs("div", {
				className: "flex flex-col items-center gap-3",
				children: [/* @__PURE__ */ jsx("div", { className: "size-8 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-foreground" }), /* @__PURE__ */ jsx("span", {
					className: "text-sm text-muted-foreground",
					children: "Loading dashboard..."
				})]
			})
		}),
		children: /* @__PURE__ */ jsx(SharedAppLayout, {
			appName: "Backup Cloud",
			children: /* @__PURE__ */ jsx(DashboardPage, {})
		})
	});
}
//#endregion
export { Home as component };
