import { useState, type HtmlHTMLAttributes } from "react";

interface SliderProps {
    title: string;
    min: number;
    max: number;
    step: number;
    value: number;
    orientation?: "horizontal" | "vertical";
}

export default function Slider({ title, min, max, step, value, orientation="horizontal"} : SliderProps) {
    const [sliderValue, setSliderValue] = useState<number>(value);
    const [textValue, setTextValue] = useState<string>(String(value));

    const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const num = Number(e.target.value);
        setSliderValue(num);
        setTextValue(String(num));
    };

    const handleBoxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setTextValue(e.target.value);
    };

    const commitValue = () => {
        let val = Number(textValue);

        if (isNaN(val)) { val = min; }
        if (val < min) { val = min; }
        if (val > max) { val = max; }

        setSliderValue(val);
        setTextValue(String(val));
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            commitValue();
        }
    };
    
    return (
        <div className={`slider-container ${orientation}`}>

            <span className="slider-title"> {title}</span>

            <div className="slider-controls"> 
                <input className="slider-input" 
                        type="range" 
                        min={min} 
                        max={max} 
                        step={step} 
                        value={sliderValue}
                        onChange={handleSliderChange} 
                />

                <input className="value-box"
                       type="number"
                       min={min}
                       max={max}
                       step={step}
                       value={textValue}
                       onChange={handleBoxChange}
                       onBlur={commitValue}
                       onKeyDown={handleKeyDown}
                    
                />
            </div>
        </div>
    );
}
