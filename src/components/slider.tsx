import React, {useState, useRef} from "react";

interface SliderProps {
    title: string;
    min: number;
    max: number;
    step: number;
    value: number;
    orientation?: "horizontal" | "vertical";
    unitOptions?: string[];
    currentUnit?: string;
    onUnitChange?: (newUnit: string) => void;
    onValueChange?: (newValue: number) => void;
    disabled?: boolean;
    onValueCommit?: (newValue: number, startValue: number) => void;
}

export default function Slider({ title, min, max, step, value, orientation="horizontal", unitOptions, currentUnit, onUnitChange, onValueChange, disabled = false, onValueCommit} : SliderProps) {
    const [sliderValue, setSliderValue] = useState<number>(value);
    const [textValue, setTextValue] = useState<string>(String(value));

    const [prevValueProp, setPrevValueProp] = useState<number>(value);

    const dragStartValueRef = useRef<number>(value);
    const isDraggingRef = useRef<boolean>(false);

    if (value !== prevValueProp) {
        setPrevValueProp(value);
        setSliderValue(value);
        setTextValue(String(value));
    }

    const beginSliderDrag = () => {
        isDraggingRef.current = true;
        dragStartValueRef.current = sliderValue;
    };

    const commitSliderDrag = () => {
        if (!isDraggingRef.current) {
            return;
        }

        isDraggingRef.current = false;
        onValueCommit?.(sliderValue, dragStartValueRef.current);
    };


    const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const num = Number(e.target.value);
        setSliderValue(num);
        setTextValue(String(num));
        onValueChange?.(num);
    };

    const handleBoxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setTextValue(e.target.value);
    };

    const commitValue = () => {
        let val = Number(textValue);

        if (isNaN(val)) { val = min; }
        if (val < min) { val = min; }
        if (val > max) { val = max; }

        const previousValue = sliderValue;

        setSliderValue(val);
        setTextValue(String(val));
        onValueChange?.(val);
        onValueCommit?.(val, previousValue);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            commitValue();
        }
    };
    
    return (
        <div className={`slider-container ${orientation}`}>



            <div className="slider-header">
                <span className="slider-title"> {title}</span>

                {unitOptions && onUnitChange && (
                    <select className="unit-selecter" 
                            value={currentUnit} 
                            onChange={(e) => onUnitChange(e.target.value)}> 
                                {unitOptions.map(unit => (
                                    <option key={unit} value={unit}>{unit}</option>
                            ))}
                            disabled={disabled}
                    </select>
                )}

            </div>
            
            <div className="slider-controls"> 
                <input className="slider-input" 
                        type="range" 
                        min={min} 
                        max={max} 
                        step={step} 
                        value={sliderValue}
                        onChange={handleSliderChange} 
                        disabled={disabled}
                        onPointerDown={beginSliderDrag}
                        onPointerUp={commitSliderDrag}
                        onPointerCancel={commitSliderDrag}
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
                       disabled={disabled}
                    
                />
            </div>
        </div>
    );
}
