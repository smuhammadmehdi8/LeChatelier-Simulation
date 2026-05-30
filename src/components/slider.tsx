interface SliderProps {
    title: string;
    min: number;
    max: number;
    step: number;
    value: number;

}

export default function Slider({ title, min, max, step, value} : SliderProps) {
    return (
        <div className = "slider-container">

            <span className="slider-title"> {title}</span>
            <input className="slider-input" type="range" min={min} max={max} step={step} defaultValue={value} />

        </div>
    );
}
