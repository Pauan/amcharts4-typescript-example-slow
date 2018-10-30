﻿/**
 * A module defining functionality for axis grid elements.
 */

/**
 * ============================================================================
 * IMPORTS
 * ============================================================================
 * @hidden
 */
import { Sprite, ISpriteProperties, ISpriteEvents, SpriteEventDispatcher, AMEvent, ISpriteAdapters } from "../../core/Sprite";
import { AxisItemLocation, AxisDataItem } from "./Axis";
import { registry } from "../../core/Registry";
import { color } from "../../core/utils/Color";
import { InterfaceColorSet } from "../../core/utils/InterfaceColorSet";


/**
 * ============================================================================
 * REQUISITES
 * ============================================================================
 * @hidden
 */

/**
 * Defines properties for [[Grid]].
 */
export interface IGridProperties extends ISpriteProperties {

	/**
	 * Location of the grid item within cell. (0-1)
	 *
	 * @type {AxisItemLocation}
	 */
	location?: AxisItemLocation;

}

/**
 * Defines events for [[Grid]].
 */
export interface IGridEvents extends ISpriteEvents { }

/**
 * Defines adapters  for [[Grid]].
 *
 * @see {@link Adapter}
 */
export interface IGridAdapters extends ISpriteAdapters, IGridProperties { }


/**
 * ============================================================================
 * MAIN CLASS
 * ============================================================================
 * @hidden
 */

/**
 * Displays an axis grid line.
 *
 * @see {@link IGridEvents} for a list of available events
 * @see {@link IGridAdapters} for a list of available Adapters
 * @todo Review: container is better, as we'll be able to attach something to the grid, also with 3d charts we might need some additional elements
 * @important
 */
export class Grid extends Sprite {

	/**
	 * Defines available properties.
	 *
	 * @type {IGridProperties}
	 */
	public _properties!: IGridProperties;

	/**
	 * Defines available adapters.
	 *
	 * @type {IGridAdapters}
	 */
	public _adapter!: IGridAdapters;

	/**
	 * Defines available events.
	 *
	 * @type {IGridEvents}
	 */
	public _events!: IGridEvents;

	/**
	 * An axis data item that corresponds to the this grid element.
	 *
	 * @type {AxisDataItem}
	 */
	public _dataItem: AxisDataItem;

	/**
	 * Constructor
	 */
	constructor() {
		super();
		this.className = "Grid";

		this.element = this.paper.add("path");

		this.location = 0.5;
		this.isMeasured = false;

		let interfaceColors = new InterfaceColorSet();
		this.stroke = interfaceColors.getFor("grid");

		this.pixelPerfect = true;
		this.strokeOpacity = 0.15;
		this.fill = color(); // "none";

		this.applyTheme();
	}

	/**
	 * Location within axis cell to place grid line on.
	 *
	 * * 0 - start
	 * * 0.5 - middle
	 * * 1 - end
	 *
	 * @param {AxisItemLocation}  value  Location (0-1)
	 */
	public set location(value: AxisItemLocation) {
		this.setPropertyValue("location", value, true);
	}

	/**
	 * @return {AxisItemLocation} Location (0-1)
	 */
	public get location(): AxisItemLocation {
		return this.getPropertyValue("location");
	}

}

/**
 * Register class in system, so that it can be instantiated using its name from
 * anywhere.
 *
 * @ignore
 */
registry.registeredClasses["Grid"] = Grid;
