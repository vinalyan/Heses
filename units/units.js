const round = Math.round
const sqrt = Math.sqrt
const max = Math.max
const min = Math.min
const abs = Math.abs
const svgNS = "http://www.w3.org/2000/svg"

// количество вертрикальных гексов
const hexh = 8
// количество горизональных геков
const hexw = 9
//количество юнитов
const mapsize=hexh*hexw

let ui = {
	hexes: [],
	t_ids: [],
	hex_x: [],
	hex_y: [],
    units: [],
    units_holder: document.getElementById("units"),
    focus: null,
	selected_hexes: [],
	active_hexes: [],
	hexes_mf_cost:[],
	path: [],

}


let units = [
    {
        ID: 1,
        Name: "34.IB (17.ID)",
        Size: "X",
        Type: "Infantry",
        Status: "Active",
        Quality: "A+",
        Nationality: "German",
        Army: "Maas Armee",
        Corps: "IX",
        Steps: {
            FullStrength: 3,
            StepLosses: 0,
            AttritionLevel: 0,       
         },
    },
    {
        ID: 2,
        Name: "2.KD",
        Size: "XX",
        Type: "Cavalry",
        Status: "Active",
        Quality: "B",
        Nationality: "German",
        Army: "",
        Corps: "2.KK",
        Steps: {
            FullStrength: 2,
            StepLosses: 0,
            AttritionLevel: 0,
        },
    },
    // Other units with Quality field included in the array
];




function build_hexes() {

    //Смещение. По сути начальные кооодиты
    let xoff = 169
    let yoff = 442

    //Радиус описывающей гекс окружности. Нужен для описания смещений. 
    let hex_w = 71.5
    //Зазор, чтобы гексы не наезжали друг на друга
    // Половина длины по горизонтале 
    let hex_h = hex_w
    // Половина длины по вертикати. 
    let hex_v = (hex_w * sqrt(3))/2

    function add_hex(x, y) {
		let gap = 3
		return [
			[ round(x-hex_h/2 + gap), round(y-hex_v + gap) ],
			[ round(x-hex_h + gap),         round(y) ],
			[ round(x-hex_h/2 + gap), round(y+hex_v -gap) ],
			[ round(x+hex_h/2 - gap), round(y+hex_v-gap) ],
			[ round(x+hex_h - gap),         round(y) ],
			[ round(x+hex_h/2 - gap), round(y-hex_v + gap) ]
		].join(" ")
	}

    /*
        Берем нулевую вертикальную. 
        Рисуем вертикальные
        Потом горизонтальные. 
        При смещении по горизонтале учитываем, что 
    */
        for(let num_h = 0; num_h < hexw; ++num_h){
            let x = (num_h * (hex_h + hex_h/2)) + xoff         
            for (let num_v = 0; num_v < hexh; ++num_v) {
                let y = (num_v * hex_v*2) - (hex_v*(num_h%2)) + yoff //тут учитываем, что каждая четная колонка ниже нечетной
                let hex_id = num_h * hexh + num_v

                let hex = ui.hexes[hex_id] = document.createElementNS(svgNS, "polygon") 

                ui.hex_x[hex_id] = round(x)	
                ui.hex_y[hex_id] = round(y)
                hex.setAttribute("class", "hex")
                hex.setAttribute("ID", '' + hex_id)
                hex.setAttribute("points", add_hex(x, y))  
              //  hex.addEventListener("mousedown", on_click_hex)
				//hex.addEventListener("mouseenter", on_focus_hex)
			//	hex.addEventListener("mouseleave", on_blur)        
                hex.hex = hex_id

				// Создание текстового элемента для отображения текста в шестиугольнике
				let t_hex = ui.t_ids[hex_id] = document.createElementNS(svgNS, "text");
				t_hex.setAttribute("x", ui.hex_x[hex_id]); // Позиция текста по оси X
				t_hex.setAttribute("y", ui.hex_y[hex_id]); // Позиция текста по оси Y
				t_hex.setAttribute("fill", "black"); // Цвет текста
				t_hex.setAttribute("font-size", "14"); // Размер шрифта текста
				t_hex.setAttribute("text-anchor", "middle"); // Выравнивание текста по центру
				t_hex.id = hex_id

				document.getElementById("mapsvg").getElementById("hexes").appendChild(t_hex);
                document.getElementById("mapsvg").getElementById("hexes").appendChild(hex)
            }
	}
    ui.loaded = true;
}

build_hexes()



let unitsContainer = document.getElementById("units-container");

function build_units(){
    units.forEach(unit => {
        let unitElement = ui.units[unit] = document.createElement("div");
        unitElement.classList.add("unit");
        unitElement.addEventListener("mousedown", on_click_unit)
        unitElement.unit = unit
        
        let unitImage = ui.units[unit].image = document.createElement("img");
        unitImage.src = `Units/${unit.ID}/${unit.Steps.FullStrength- unit.Steps.StepLosses}.png`
        unitElement.appendChild(unitImage);


        // Create and add quality image
        let qualityImage = document.createElement("img");
        qualityImage.classList.add("quality-image");
        //qualityImage.src = `Units/${unit.ID}/${unit.Steps.FullStrength - unit.Steps.StepLosses}.png`;
        unitElement.appendChild(qualityImage);

        unitsContainer.appendChild(unitElement);
    });
    console.info(`После создания: ${ui.units}`)

}
build_units()

function update_units()
{
    console.info(ui.units)

        console.info(`В обновлении: ${ui.units}`)

    ui.units.forEach(
        u =>{
            u.image.src = `Units/${u.ID}/${u.Steps.FullStrength- u.Steps.StepLosses}.png`
        }
    )

}


function on_click_unit(evt)
{
    if (evt.button === 0) {
        evt.stopPropagation()
        evt.target.unit.Steps.StepLosses = evt.target.unit.Steps.StepLosses + 1
        update_units()
	}
}