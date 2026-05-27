interface SliderProps {
    title: string;
    min: number;
    max: number;

}

export default function Slider({ title, min, max} : SliderProps) {
    return (
        <div className = "slider-container">

            <span className="slider-title"> {title}</span>
            <input className= "slider-input" type="range" min={min} max={max} />

        </div>
    );
}
