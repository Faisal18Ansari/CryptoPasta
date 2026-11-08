import { Button } from "@/components/ui/button";
import { fetchMarketChart } from "@/state/coin/Action";
import React, { useEffect, useState } from "react";
import Chart from "react-apexcharts";
import { useDispatch, useSelector } from "react-redux";
import { formatIndianNumber } from "@/lib/utils";

const StockChart = ({ coinId }) => {
    const dispatch = useDispatch();
    const marketChart = useSelector((state) => state.coin.marketChart);

    const series = [
        {
            data: marketChart?.coinId === coinId ? marketChart.data ?? [] : [],
        },
    ];
    const timeSeries = [
        {
            keyword: "DIGITAL_CURRENCY_DAILY",
            key: "Time Series (Daily)",
            label: "1 Day",
            value: 1
        },
        {
            keyword: "DIGITAL_CURRENCY_WEEKLY",
            key: "Time Series (Weekly)",
            label: "1 Week",
            value: 7
        },
        {
            keyword: "DIGITAL_CURRENCY_MONTHLY",
            key: "Time Series (Monthly)",
            label: "1 Month",
            value: 30
        },
        {
            keyword: "DIGITAL_CURRENCY_YEARLY",
            key: "Time Series (Yearly)",
            label: "1 Year",
            value: 365
        }
    ];
    const options = {
        chart: {
            id: "area-datetime",
            type: "area",
            height: 350,
            zoom: {
                autoScaleYaxis: true
            }
        },
        dataLabels: {
            enabled: false
        },
        xaxis: {
            type: "datetime",
            tickAmount: 6
        },
        yaxis: {
            labels: {
                formatter: value => formatIndianNumber(value, 2),
            },
        },
        colors: ["var(--chart-4)"],
        markers: {
            colors: ["#fff"],
            strokeColor: "#fff",
            size: 0,
            strokeWidth: 1,
            style: "hollow"
        },
        tooltip: {
            theme: "dark",
            y: {
                formatter: value => `₹${formatIndianNumber(value, 2)}`,
            },
        },
        fill: {
            type: "gradient",
            gradient: {
                shadeIntensity: 1,
                opacityFrom: 0.7,
                opacityTo: 0.9,
                stops: [0, 100]
            }
        },
        grid: {
            borderColor: "#47535E",
            strokeDashArray: 4,
            show: true
        }
    }
    const [activeLabel, setActiveLabel] = useState(timeSeries[0]);
    const handleActiveLabel = (value) => {
        setActiveLabel(value);
    }
    useEffect(() => {
        if (!coinId) return;
        const controller = new AbortController();
        dispatch(fetchMarketChart({
            coinId,
            days: activeLabel.value,
            jwt: localStorage.getItem("jwt"),
            signal: controller.signal,
        }));

        return () => controller.abort();
    }, [dispatch, coinId, activeLabel])
    return (
        <div>
            <div className="space-x-3">
                {timeSeries.map((item) => <Button variant={activeLabel.label === item.label ? "default" : "outline"} onClick={() => handleActiveLabel(item)} key={item.label}>
                    {item.label}
                </Button>)}
            </div>
            <div id="chart-timelines">
                {!coinId ? (
                    <div className="flex h-[350px] items-center justify-center text-sm text-muted-foreground">
                        Select a coin to view its chart.
                    </div>
                ) : series[0]?.data?.length ? (
                    <Chart
                        options={options}
                        series={series}
                        type="area"
                        height={350}
                    />
                ) : (
                    <div className="flex h-[350px] items-center justify-center text-sm text-muted-foreground">
                        {marketChart?.coinId === coinId && marketChart.error
                            ? "Unable to load chart. Please try selecting the coin again."
                            : "Loading chart…"}
                    </div>
                )}
            </div>
        </div>
    )
}
export default StockChart;