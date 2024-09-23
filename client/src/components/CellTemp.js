import { format } from "d3-format"
import { scaleLinear } from "d3-scale"
import { arc } from "d3-shape"
import React, { useEffect, useState } from "react"

const CellTemp = ({ data,
    min = 2.6,
    max = 3.65,
    label,
    units,
}) => {
    const backgroundArc = arc()
        .innerRadius(0.80)
        .outerRadius(1)
        .startAngle(-Math.PI / 2)
        .endAngle(Math.PI / 2)
        .cornerRadius(1)
        ()
    const [MinCellVoltage, setMinCellVoltage] = useState(data[0]?.minCellVoltage);
    const [CellImbalance, setCellImbalance] = useState(data[0]?.cellImbalance);

    useEffect(() => {
        setMinCellVoltage(data[0]?.minCellVoltage);

        setCellImbalance(data[0]?.cellImbalance);
    }, [data]);

    const percentScale = scaleLinear()
        .domain([min, max])
        .range([0, 1])
    const percent = percentScale(MinCellVoltage)

    const angleScale = scaleLinear()
        .domain([0, 1])
        .range([-Math.PI / 2, Math.PI / 2])
        .clamp(true)

    const angle = angleScale(percent)

    const filledArc = arc()
        .innerRadius(0.8)
        .outerRadius(1)
        .startAngle(-Math.PI / 2)
        .endAngle(angle)
        .cornerRadius(1)
        ()

    const colorScale = scaleLinear()
        .domain([0, 1])
        .range(["#A2A4EF", "#A2A4EF"])

    const gradientSteps = colorScale.ticks(10)
        .map(value => colorScale(value))

    const markerLocation = getCoordsOnArc(
        angle,
        1 - ((1 - 0.65) / 2),
    )

    return (
        <div
            style={{
                textAlign: "center",
            }}>
            <svg style={{ overflow: "visible", position: "relative", bottom: 140 }}
                width="10em"
                viewBox={[
                    -1, -1,
                    2, 1,
                ].join(" ")}>
                <defs>
                    <linearGradient
                        id="Gauge__gradient"
                        gradientUnits="userSpaceOnUse"
                        x1="-1"
                        x2="1"
                        y2="0">
                        {gradientSteps.map((color, index) => (
                            <stop
                                key={color}
                                stopColor={color}
                                offset={`${index
                                    / (gradientSteps.length - 1)
                                    }`}
                            />
                        ))}
                    </linearGradient>
                </defs>
                <path
                    d={backgroundArc}
                    fill="#e6ecf9"
                />
                <path
                    d={filledArc}
                    fill="#A2A4EF"
                />
            </svg>

            <div style={{
                position: "relative",
                bottom: 67,
                color: "#A2A4EF",
                fontSize: "25px",
                lineHeight: "1em",
                fontWeight: "900",
                fontFeatureSettings: "'zero', 'tnum' 1",
            }}>
                Min {format(",")(MinCellVoltage)} V
            </div>
            <br />
            <div style={{
                position: "relative",
                bottom: 67,
                color: CellImbalance > 0.25 ? "#FF0000" : "#A2A4EF",
                fontSize: "25px",
                lineHeight: "1em",
                fontWeight: "900",
                fontFeatureSettings: "'zero', 'tnum' 1",
            }}>
                Cell Imbalance {format(",")(CellImbalance)}
            </div>

            {!!label && (
                <div style={{
                    color: "#8b8ba7",
                    marginTop: "0.6em",
                    fontSize: "1.3em",
                    lineHeight: "1.3em",
                    fontWeight: "700",
                }}>
                    {label}
                </div>
            )}

            {!!units && (
                <div style={{
                    color: "#8b8ba7",
                    lineHeight: "1.3em",
                    fontWeight: "300",
                }}>
                    {units}
                </div>
            )}
        </div>
    )
}

const getCoordsOnArc = (angle, offset = 10) => [
    Math.cos(angle - (Math.PI / 2)) * offset,
    Math.sin(angle - (Math.PI / 2)) * offset,
]

export default CellTemp;