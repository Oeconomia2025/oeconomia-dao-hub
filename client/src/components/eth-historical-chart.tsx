import { useEffect, useRef } from "react";

export function ETHHistoricalChart() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current || !wrapperRef.current) return;
    initialized.current = true;

    const wrapper = wrapperRef.current;

    // Build the widget container from scratch
    const container = document.createElement("div");
    container.className = "tradingview-widget-container";
    container.style.height = "100%";
    container.style.width = "100%";

    const widgetDiv = document.createElement("div");
    widgetDiv.className = "tradingview-widget-container__widget";
    widgetDiv.style.height = "calc(100% - 32px)";
    widgetDiv.style.width = "100%";
    container.appendChild(widgetDiv);

    const copyright = document.createElement("div");
    copyright.className = "tradingview-widget-copyright";
    copyright.innerHTML = `<a href="https://www.tradingview.com/symbols/ETHUSD/?exchange=INDEX" rel="noopener nofollow" target="_blank"><span class="blue-text" style="color:#3b82f6;font-size:12px">Ethereum price</span></a><span style="color:#6b7280;font-size:12px">&nbsp;by TradingView</span>`;
    container.appendChild(copyright);

    const script = document.createElement("script");
    script.type = "text/javascript";
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-symbol-overview.js";
    script.async = true;
    script.textContent = JSON.stringify({
      symbols: [["INDEX:ETHUSD|1D"]],
      chartOnly: false,
      width: "100%",
      height: "100%",
      autosize: true,
      locale: "en",
      colorTheme: "dark",
      isTransparent: false,
      backgroundColor: "#030712",
      lineWidth: 2,
      lineType: 0,
      chartType: "area",
      lineColor: "rgba(255, 255, 255, 1)",
      topColor: "rgba(255, 255, 255, 0.66)",
      bottomColor: "rgba(15, 15, 15, 1)",
      fontColor: "rgba(255, 255, 255, 1)",
      gridLineColor: "rgba(242, 242, 242, 0.06)",
      volumeUpColor: "rgba(34, 171, 148, 0.5)",
      volumeDownColor: "rgba(247, 82, 95, 0.5)",
      widgetFontColor: "#DBDBDB",
      upColor: "#22ab94",
      downColor: "#f7525f",
      borderUpColor: "#22ab94",
      borderDownColor: "#f7525f",
      wickUpColor: "#22ab94",
      wickDownColor: "#f7525f",
      scalePosition: "right",
      scaleMode: "Normal",
      fontFamily: "-apple-system, BlinkMacSystemFont, Trebuchet MS, Roboto, Ubuntu, sans-serif",
      valuesTracking: "1",
      changeMode: "price-and-percent",
      dateRanges: [
        "1d|1",
        "1m|30",
        "3m|60",
        "12m|1D",
        "60m|1W",
        "all|1M",
      ],
      fontSize: "12",
      headerFontSize: "medium",
      noTimeScale: false,
      hideDateRanges: false,
      hideMarketStatus: false,
      hideSymbolLogo: false,
    });
    container.appendChild(script);

    wrapper.appendChild(container);
  }, []);

  return (
    <div
      className="rounded-lg border border-crypto-border overflow-hidden"
      style={{ background: "#030712", height: "500px" }}
    >
      <div ref={wrapperRef} style={{ height: "100%", width: "100%" }} />
    </div>
  );
}
