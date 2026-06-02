
interface DropdownProps {
    label: string;
    value1: string;
    value2: string;
    value3: string;
    name1: string;
    name2: string;
    name3: string;
}


export default function Dropdown({label, value1, value2, value3, name1, name2, name3} : DropdownProps) {
    return (
        <div className="dropdown-container"> 

            <label className="dropdown-label">{label}</label>
            <select className="dropdown-menu"> 
                <option value={value1}>{name1}</option>
                <option value={value2}>{name2}</option>
                <option value={value3}>{name3}</option>
            </select>

        </div>
    )
}