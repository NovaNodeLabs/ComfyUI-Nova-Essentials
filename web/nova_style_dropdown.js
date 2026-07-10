import { app } from "../../scripts/app.js";
import { api } from "../../scripts/api.js";

function widget(node, name) {
    return node.widgets?.find((w) => w.name === name);
}

function isNovaStyleLoader(nodeData) {
    const name = nodeData?.name || "";
    return name === "NovaLoadStylesCSVPro" || name === "NovaLoadCharactersCSVPro";
}

function isCharacterLoader(nodeData) {
    return (nodeData?.name || "") === "NovaLoadCharactersCSVPro";
}

function setComboValues(w, values, fallback) {
    if (!w || !Array.isArray(values) || values.length === 0) return;
    w.options = w.options || {};
    w.options.values = values;
    if (!values.includes(w.value)) {
        w.value = values.includes(fallback) ? fallback : values[0];
    }
}

async function refreshNovaCSVDropdown(node, nodeData, quiet = false) {
    const csv = widget(node, "csv_file_path");
    const style = widget(node, "style");
    const category = widget(node, "category");
    const search = widget(node, "search");

    if (!csv || !style) return;

    const kind = isCharacterLoader(nodeData) ? "characters" : "styles";
    const fallbackStyle = kind === "characters" ? "No Character/None" : "No Style";
    const fallbackCategory = "All";

    const params = new URLSearchParams();
    params.set("csv", csv.value || "");
    params.set("kind", kind);
    params.set("search", search?.value || "");
    params.set("category", category?.value || "All");

    try {
        const response = await api.fetchApi(`/nova_styles_csv_pro/list?${params.toString()}`);
        const data = await response.json();
        if (!data.ok) throw new Error(data.error || "CSV list request failed");

        setComboValues(style, data.styles || [], fallbackStyle);
        setComboValues(category, data.categories || [], fallbackCategory);

        node.setDirtyCanvas?.(true, true);
        app.graph?.setDirtyCanvas?.(true, true);

        if (!quiet) {
            console.log(`[Nova CSV] Dropdown refreshed: ${data.filtered_count}/${data.count} from ${data.resolved_path}`);
        }
    } catch (err) {
        console.warn("[Nova CSV] Dropdown refresh failed:", err);
    }
}

function debounceRefresh(node, nodeData) {
    clearTimeout(node.__novaCSVRefreshTimer);
    node.__novaCSVRefreshTimer = setTimeout(() => refreshNovaCSVDropdown(node, nodeData, true), 250);
}

function wrapWidgetCallback(node, nodeData, name) {
    const w = widget(node, name);
    if (!w || w.__novaWrapped) return;
    const old = w.callback;
    w.callback = function (...args) {
        const result = old?.apply(this, args);
        debounceRefresh(node, nodeData);
        return result;
    };
    w.__novaWrapped = true;
}

app.registerExtension({
    name: "NovaEssentials.CSVDropdownRefresh",
    async beforeRegisterNodeDef(nodeType, nodeData) {
        if (!isNovaStyleLoader(nodeData)) return;

        const originalOnNodeCreated = nodeType.prototype.onNodeCreated;
        nodeType.prototype.onNodeCreated = function () {
            const result = originalOnNodeCreated?.apply(this, arguments);

            const node = this;
            if (!node.__novaCSVRefreshButtonAdded) {
                node.addWidget("button", "🔄 Reload CSV Dropdown", null, () => refreshNovaCSVDropdown(node, nodeData, false));
                node.__novaCSVRefreshButtonAdded = true;
            }

            for (const name of ["csv_file_path", "category", "search", "favorites_list", "use_saved_favorites"]) {
                wrapWidgetCallback(node, nodeData, name);
            }

            // Initial refresh after the node appears, so the dropdown matches the CSV path currently in the widget.
            setTimeout(() => refreshNovaCSVDropdown(node, nodeData, true), 100);
            return result;
        };
    },
});
