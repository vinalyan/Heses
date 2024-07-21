"use strict"

// https://www.redblobgames.com/grids/hexagons/

const svgNS = "http://www.w3.org/2000/svg"
const round = Math.round
const sqrt = Math.sqrt
const max = Math.max
const min = Math.min
const abs = Math.abs

const dist = 2


/// тут заканчиваются временные переменные

let ui = {
	hexes: [],
	t_ids: [],
	hex_x: [],
	hex_y: [],
    units: [],
    units_holder: document.getElementById("units"),
    focus: null,
	selected_hexes: [],
}

// СОСТОЯНИЕ ОТРЯДОВ 
//Гекс отряда 
const UNIT_HEX_SHIFT = 0
const UNIT_HEX_MASK = 255 << UNIT_HEX_SHIFT


function is_any_hex_action(hex) {
	if (view.actions && view.actions.hex && view.actions.hex.includes(hex))
		return true
	return false
}


function is_hex_selected(hex) {
	if (hex === view.pursuit || hex === view.battle || hex === view.selected_hexes)
		return true
	if (Array.isArray(view.selected_hexes) && view.selected_hexes.includes(hex))
		return true
	return false
}

//TODO выпилить это штука тут нужна для дебага



function hex_to_coordinates(h){
	let q = Math.floor(h / hexh)
	let r = h% hexh - Math.floor((q+1) / 2)
	let s = 0-q-r
	return {q,r,s}
}

// количество вертрикальных гексов
const hexh = 8
// количество горизональных геков
const hexw = 9
//количество юнитов
const unit_count = 10

let stack_list = new Array(hexh * hexw)
for (let i = 0; i < stack_list.length; ++i)
	stack_list[i] = []

// Генерим гексы.

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
                hex.addEventListener("mousedown", on_click_hex)
				hex.addEventListener("mouseenter", on_focus_hex)
				hex.addEventListener("mouseleave", on_blur)        
                hex.hex = hex_id
				hex.classList.add("action")

				// Создание текстового элемента для отображения текста в шестиугольнике
				let t_hex = ui.t_ids[hex_id] = document.createElementNS(svgNS, "text");
				t_hex.setAttribute("x", ui.hex_x[hex_id]); // Позиция текста по оси X
				t_hex.setAttribute("y", ui.hex_y[hex_id]); // Позиция текста по оси Y
				t_hex.setAttribute("fill", "black"); // Цвет текста
				t_hex.setAttribute("font-size", "14"); // Размер шрифта текста
				t_hex.setAttribute("text-anchor", "middle"); // Выравнивание текста по центру
				t_hex.textContent = `h: ${hex_id}`
				t_hex.id = hex_id

				// Добавляем текстовый элемент в SVG канвас

				document.getElementById("mapsvg").getElementById("hexes").appendChild(t_hex);


                document.getElementById("mapsvg").getElementById("hexes").appendChild(hex)
            }
	}
    ui.loaded = true;
}


function on_update() {
	if (!ui.loaded) {
		return setTimeout(on_update, 500)
	}
    update_map()
    action_button("undo", "Undo")
	action_button('end_ABU_ABF', "End ABU BF")
	action_button('end_preper_to_Assault_ABF', "End Preper to Assault")
	action_button('end_movement_phase_step_1', "End Mandatory Withdrawal")
	action_button('end_movement_phase_step_2', "End Move Phase")
	action_button('end_resolution_of_assault', "end_resolution_of_assault")
	action_button('combat', "combat")
	action_button('end_combat_phase_step_1', "end_combat_phase_step_1")
	action_button('end_combat_phase_step_2', "end_combat_phase_step_2")
}

build_hexes()



function update_map() {
    for (let i = 0; i < stack_list.length; ++i) {
		stack_list[i].length = 0
	}
	for (let u = 0; u < unit_count; ++u) 
        {
            let hex = unit_hex(u)
            let e = ui.units[u]
		    if (!ui.units_holder.contains(e))
            ui.units_holder.appendChild(e)  
			if(hex){
				stack_list[hex].push(u)
				e.stack = stack_list[hex]
				layout_stack(stack_list[hex], hex, ui.hex_x[hex],ui.hex_y[hex],60, -1)
			}
        }
	for (let hex = 0; hex < stack_list.length; ++hex) {
		if (ui.hexes[hex]) {
			ui.hexes[hex].classList.toggle("action", is_any_hex_action(hex))
			ui.hexes[hex].classList.toggle("selected", is_hex_selected(hex))
		}
	
	}	
}

//количество отрядов в гексе.

function on_focus_hex(evt) {
	let hex = evt.target.hex
    let text = ui.hexes[hex].hex +'->'+ hex_to_coordinates(hex).q + ','+ hex_to_coordinates(hex).r+','+hex_to_coordinates(hex).s
	document.getElementById("status").textContent = text
}

function on_click_hex(evt) {
	let hex  =evt.target.hex
	ui.hexes[hex].classList.toggle("selected")
	ui.selected_hexes.push(hex)
}

function on_blur(evt) {
	document.getElementById("status").textContent = ""
}

// КОНЕЦ СОБЫТИЙ МЫШИ И КЛАВЫ

function set_clear()
{
	for (let h of ui.selected_hexes) {
		ui.hexes[h].classList.toggle("Clear")
	}
}

function set_broken()
{
	for (let h of ui.selected_hexes) {
		ui.hexes[h].classList.toggle("Broken")
	}
}

function set_rough()
{
	for (let h of ui.selected_hexes) {
		ui.hexes[h].classList.toggle("Rough")
	}
}

function set_mountainous()
{
	for (let h of ui.selected_hexes) {
		ui.hexes[h].classList.toggle("Mountainous")
	}
}

function set_lowland()
{
	for (let h of ui.selected_hexes) {
		ui.hexes[h].classList.toggle("Lowland")
	}
}

function set_flood_plain()
{
	for (let h of ui.selected_hexes) {
		ui.hexes[h].classList.toggle("Flood")	
	}
}




// Дебаг. Следим за координатами курсором.

const coordsDiv = document.getElementById('coords');

document.addEventListener('mousemove', (event) => {
    const mouseX = event.clientX;
    const mouseY = event.clientY;

    coordsDiv.style.left = `${mouseX + 10}px`;
    coordsDiv.style.top = `${mouseY + 10}px`;
    coordsDiv.textContent = `X: ${mouseX}, Y: ${mouseY}}` ;
});

