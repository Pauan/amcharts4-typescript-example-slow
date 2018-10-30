﻿/**
 * Functionality for adding images in SVG tree.
 */

/**
 * ============================================================================
 * IMPORTS
 * ============================================================================
 * @hidden
 */
import { Sprite, ISpriteProperties, ISpriteAdapters, ISpriteEvents, SpriteEventDispatcher, AMEvent } from "../Sprite";
import { registry } from "../Registry";
import * as $dom from "../utils/DOM";
import * as $type from "../utils/Type";
import { IRectangle } from "../defs/IRectangle";


/**
 * ============================================================================
 * REQUISITES
 * ============================================================================
 * @hidden
 */

/**
 * Defines properties for [[Image]].
 */
export interface IImageProperties extends ISpriteProperties {

	/**
	 * A URI of the image.
	 *
	 * @type {string}
	 */
	href?: string;

	/**
	 * Sets image `width` in relation to its `height`.
	 * 
	 * @type {number}
	 */
	widthRatio?: number;

	/**
	 * Sets image `height` in relation to its `width`.
	 * 
	 * @type {number}
	 */
	heightRatio?: number;
}

/**
 * Defines events for [[Image]].
 */
export interface IImageEvents extends ISpriteEvents { }

/**
 * Defines adapters for [[Image]].
 *
 * @see {@link Adapter}
 */
export interface IImageAdapters extends ISpriteAdapters, IImageProperties { }


/**
 * ============================================================================
 * MAIN CLASS
 * ============================================================================
 * @hidden
 */

/**
 * Used to add `<image>` elements to SVG.
 *
 * @see {@link IImageEvents} for a list of available events
 * @see {@link IImageAdapters} for a list of available Adapters
 */
export class Image extends Sprite {

	/**
	 * Defines available properties.
	 *
	 * @type {IImageProperties}
	 */
	public _properties!: IImageProperties;

	/**
	 * Defines available adapters.
	 *
	 * @type {IImageAdapters}
	 */
	public _adapter!: IImageAdapters;

	/**
	 * Defines available events.
	 *
	 * @type {IImageEvents}
	 */
	public _events!: IImageEvents;

	/**
	 * Constructor
	 */
	constructor() {
		super();
		this.className = "Image";
		this.element = this.paper.add("image");
		this.applyTheme();

		this.width = 50;
		this.height = 50;
	}

	/**
	 * Draws an `<image>` element.
	 *
	 * @ignore Exclude from docs
	 */
	public draw(): void {
		super.draw();
		if (this.href) {

			let width = this.innerWidth;
			let height = this.innerHeight;

			if ($type.isNumber(this.widthRatio)) {
				width = height * this.widthRatio;
				this.width = width;
			}

			if ($type.isNumber(this.heightRatio)) {
				height = width * this.heightRatio;
				this.height = height;
			}


			this.element.attr({
				"width": width,
				"height": height
			});
			this.element.attrNS($dom.XLINK, "xlink:href", this.href);
		}
	}

	/**
	 * An image URI.
	 *
	 * @param {string}  value  Image URI
	 */
	public set href(value: string) {
		this.setPropertyValue("href", value, true);
	}

	/**
	 * @return {string} Image URI
	 */
	public get href(): string {
		return this.getPropertyValue("href");
	}

	/**
	 * Sets image `width` relatively to its `height`.
	 *
	 * If image's `height = 100` and `widthRatio = 0.5` the actual width will be
	 * `50`.
	 * 
	 * @param {number}  value  Ratio
	 */
	public set widthRatio(value: number) {
		this.setPropertyValue("widthRatio", value, true);
	}

	/**
	 * @return {number} Ratio
	 */
	public get widthRatio(): number {
		return this.getPropertyValue("widthRatio");
	}

	/**
	 * Sets image `height` relatively to its `width`.
	 *
	 * If image's `width = 100` and `heightRatio = 0.5` the actual height will be
	 * `50`.
	 * 
	 * @param {number}  value  Ratio
	 */
	public set heightRatio(value: number) {
		this.setPropertyValue("heightRatio", value, true);
	}

	/**
	 * @return {number} Ratio
	 */
	public get heightRatio(): number {
		return this.getPropertyValue("heightRatio");
	}


	/**
	 * Returns bounding box (square) for this element.
	 *
	 * @ignore Exclude from docs
	 * @type {IRectangle}
	 */
	public get bbox(): IRectangle {
		return {
			x: 0,
			y: 0,
			width: this.pixelWidth,
			height: this.pixelHeight
		};
	}
}

/**
 * Register class in system, so that it can be instantiated using its name from
 * anywhere.
 *
 * @ignore
 */
registry.registeredClasses["Image"] = Image;
