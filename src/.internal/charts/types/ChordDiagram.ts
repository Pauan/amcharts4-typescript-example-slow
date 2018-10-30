/**
 * Chord diagram module.
 */

/**
 * ============================================================================
 * IMPORTS
 * ============================================================================
 * @hidden
 */
import { Chart, IChartProperties, IChartDataFields, IChartAdapters, IChartEvents, ChartDataItem } from "../Chart";
import { FlowDiagram, FlowDiagramDataItem, IFlowDiagramAdapters, IFlowDiagramDataFields, IFlowDiagramEvents, IFlowDiagramProperties } from "./FlowDiagram";
import { SpriteEventDispatcher, AMEvent } from "../../core/Sprite";
import { percent, Percent } from "../../core/utils/Percent";
import { DataItem, IDataItemEvents } from "../../core/DataItem";
import { ListTemplate, ListDisposer } from "../../core/utils/List";
import { DictionaryTemplate, DictionaryDisposer } from "../../core/utils/Dictionary";
import { Legend, ILegendDataFields, LegendDataItem } from "../Legend";
import { Container } from "../../core/Container";
import { registry } from "../../core/Registry";
import { ChordNode } from "../elements/ChordNode";
import { ChordLink } from "../elements/ChordLink";
import { LinearGradientModifier } from "../../core/rendering/fills/LinearGradientModifier";
import { ColorSet } from "../../core/utils/ColorSet";
import { toColor, Color } from "../../core/utils/Color";
import { Orientation } from "../../core/defs/Orientation";
import * as $iter from "../../core/utils/Iterator";
import * as $math from "../../core/utils/Math";
import * as $type from "../../core/utils/Type";
import * as $number from "../../core/utils/Number";
import * as $order from "../../core/utils/Order";
import * as $utils from "../../core/utils/Utils";

/**
 * ============================================================================
 * DATA ITEM
 * ============================================================================
 * @hidden
 */

//@todo rearange notes after dragged

/**
 * Defines a [[DataItem]] for [[ChordDiagram]].
 *
 * @see {@link DataItem}
 */
export class ChordDiagramDataItem extends FlowDiagramDataItem {

	/**
	 * Defines a type of [[Component]] this data item is used for.
	 *
	 * @type {ChordDiagram}
	 */
	public _component!: ChordDiagram;

	/**
	 * An a link element, connecting two nodes.
	 * @type {ChordLink}
	 */
	public _link: ChordLink;

	/**
	 * An origin node.
	 *
	 * @type {ChordNode}
	 */
	public fromNode: ChordNode;

	/**
	 * A destination node.
	 *
	 * @type {ChordNode}
	 */
	public toNode: ChordNode;

	/**
	 * Constructor
	 */
	constructor() {
		super();
		this.className = "ChordDiagramDataItem";
		this.applyTheme();
	}
}


/**
 * ============================================================================
 * REQUISITES
 * ============================================================================
 * @hidden
 */

/**
 * Defines data fields for [[ChordDiagram]].
 */
export interface IChordDiagramDataFields extends IFlowDiagramDataFields {

	/**
	 * Name of the source node.
	 *
	 * @type {string}
	 */
	fromName?: string;

	/**
	 * Name of the target node.
	 *
	 * @type {string}
	 */
	toName?: string;

	/**
	 * Value of the link between two nodes.
	 *
	 * @type {string}
	 */
	value?: string;

	/**
	 * Color of a from node
	 *
	 * @type {string}
	 */
	color?: string;
}

/**
 * Defines properties for [[ChordDiagram]]
 */
export interface IChordDiagramProperties extends IFlowDiagramProperties {
	/**
	 * Radius of the Chord. Absolute or relative.
	 *
	 * @type {number | Percent}
	 */
	radius?: number | Percent;

	/**
	 * Inner radius of the Chord nodes. Absolute or relative. Negative value means that the inner radius will be calculated from the radius, not from the center.
	 *
	 * @type {number | Percent}
	 */
	innerRadius?: number | Percent;

	/**
	 * An angle radar face starts on. (degrees)
	 *
	 * @default -90
	 * @type {number}
	 */
	startAngle?: number;

	/**
	 * An angle radar face ends on. (degrees)
	 *
	 * @default 270
	 * @type {number}
	 */
	endAngle?: number;


	/**
	 * If you set this to true, all the lines will be of the same width.
	 *
	 * @default false
	 * @type {boolean}
	 */
	nonRibbon?: boolean;
}

/**
 * Defines events for [[ChordDiagram]].
 */
export interface IChordDiagramEvents extends IFlowDiagramEvents { }

/**
 * Defines adapters for [[ChordDiagram]].
 *
 * @see {@link Adapter}
 */
export interface IChordDiagramAdapters extends IFlowDiagramAdapters, IChordDiagramProperties { }


/**
 * ============================================================================
 * MAIN CLASS
 * ============================================================================
 * @hidden
 */

/**
 * Creates a Chord Diagram chart.
 *
 * @see {@link IChordDiagramEvents} for a list of available Events
 * @see {@link IChordDiagramAdapters} for a list of available Adapters
 * @see {@link https://www.amcharts.com/docs/v4/chart-types/chord-diagram/} for documentation
 * @important
 */
export class ChordDiagram extends FlowDiagram {

	/**
	 * Defines a type for the DataItem.
	 *
	 * @type {ChordDiagramDataItem}
	 */
	public _dataItem: ChordDiagramDataItem;

	/**
	 * Defines available data fields.
	 *
	 * @type {IChordDiagramDataFields}
	 */
	public _dataFields: IChordDiagramDataFields;

	/**
	 * Defines available properties.
	 *
	 * @type {IChordDiagramProperties}
	 */
	public _properties!: IChordDiagramProperties;

	/**
	 * Defines available adapters.
	 *
	 * @type {SeriesAdapters}
	 */
	public _adapter!: IChordDiagramAdapters;

	/**
	 * Defines available events.
	 *
	 * @type {IChordDiagramEvents}
	 */
	public _events!: IChordDiagramEvents;

	/**
	 * A list of chart's Chord nodes.
	 *
	 * @param {DictionaryTemplate<string, ChordNode>}
	 */
	public nodes: DictionaryTemplate<string, ChordNode>;

	/**
	 * An a link element, connecting two nodes.
	 * @type {ChordLink}
	 */
	public _link: ChordLink;

	/**
	 * Sorted nodes iterator.
	 *
	 * @ignore
	 * @type {Iterator}
	 */
	protected _sorted: $iter.Iterator<[string, ChordNode]>;

	/**
	 * [valueAngle description]
	 *
	 * @ignore Exclude from docs
	 * @todo Description
	 * @type {number}
	 */
	public valueAngle: number = 0;

	/**
	 * A container for chord elemens.
	 *
	 * @type {Container}
	 */
	public chordContainer:Container;

	/**
	 */
	public _node:ChordNode;


	/**
	 * Constructor
	 */
	constructor() {

		// Init
		super();
		this.className = "ChordDiagram";

		this.startAngle = -90;
		this.endAngle = 270;

		this.radius = percent(80);

		this.innerRadius = - 15;

		this.nodePadding = 5;

		let chordContainer = this.chartContainer.createChild(Container);
		chordContainer.align = "center";
		chordContainer.valign = "middle";
		chordContainer.shouldClone = false;
		chordContainer.layout = "none";
		this.chordContainer = chordContainer;

		this.nodesContainer.parent = chordContainer;
		this.linksContainer.parent = chordContainer;

		// Apply theme
		this.applyTheme();
	}

	/**
	 * Redraws the chart.
	 *
	 * @ignore Exclude from docs
	 */
	public validate(): void {
		let chartContainer = this.chartContainer;
		let nodesContainer = this.nodesContainer;
		let radius = $utils.relativeRadiusToValue(this.radius, $math.min(chartContainer.innerWidth, chartContainer.innerHeight)) / 2;

		let pixelInnerRadius = $utils.relativeRadiusToValue(this.innerRadius, radius, true);
		let endAngle = this.endAngle;
		let startAngle = this.startAngle + this.nodePadding / 2;

		let rect = $math.getArcRect(this.startAngle, this.endAngle, 1);

		let total = this.dataItem.values.value.sum;
		let count = 0;

		let newTotal = 0;
		$iter.each(this._sorted, (strNode) => {
			let node = strNode[1];
			this.getNodeValue(node);
			count++;
			let value = node.total;
			if(node.total / total < this.minNodeSize){
				value = total * this.minNodeSize;
			}
			newTotal += value;
		});

		this.valueAngle = (endAngle - this.startAngle - this.nodePadding * count) / newTotal;

		$iter.each(this._sorted, (strNode) => {
			let node = strNode[1];
			let slice = node.slice;

			slice.radius = radius;
			slice.innerRadius = pixelInnerRadius;

			let value = node.total;

			if(node.total / total < this.minNodeSize){
				value = total * this.minNodeSize;
			}

			node.adjustedTotal = value;

			let arc: number;
			if (this.nonRibbon) {
				arc = (endAngle - this.startAngle) / count - this.nodePadding;
			}
			else {
				arc = this.valueAngle * value;
			}

			slice.arc = arc;
			slice.startAngle = startAngle;
			node.trueStartAngle = startAngle;
			node.parent = this.nodesContainer;
			node.validate(); // otherwise flickers - nodes are already created, but not yet positioned etc.
			startAngle += arc + this.nodePadding;
		})

		this.chordContainer.definedBBox = { x: radius * rect.x, y: radius * rect.y, width: radius * rect.width, height: radius * rect.height };
		this.chordContainer.invalidateLayout();

		super.validate();		
	}

	/**
	 * Sets defaults that instantiate some objects that rely on parent, so they
	 * cannot be set in constructor.
	 */
	protected applyInternalDefaults(): void {

		super.applyInternalDefaults();

		// Add a default screen reader title for accessibility
		// This will be overridden in screen reader if there are any `titles` set
		if (!$type.hasValue(this.readerTitle)) {
			this.readerTitle = this.language.translate("Chord diagram");
		}
	}

	/**
	 * Creates and returns a new data item.
	 *
	 * @return {this} Data item
	 */
	protected createDataItem(): this["_dataItem"] {
		return new ChordDiagramDataItem();
	}

	/**
	 * Starting angle of the Radar face. (degrees)
	 *
	 * Normally, a circular radar face begins (the radial axis is drawn) at the
	 * top center. (at -90 degrees)
	 *
	 * You can use `startAngle` to change this setting.
	 *
	 * E.g. setting this to 0 will make the radial axis start horizontally to
	 * the right, as opposed to vertical.
	 *
	 * For a perfect circle the absolute sum of `startAngle` and `endAngle`
	 * needs to be 360.
	 *
	 * However, it's **not** necessary to do so. You can set those to lesser
	 * numbers, to create semi-circles.
	 *
	 * E.g. `startAngle = -90` with `endAngle = 0` will create a radar face that
	 * looks like a quarter of a circle.
	 *
	 * @default -90
	 * @param {number}  value  Start angle (degrees)
	 */
	public set startAngle(value: number) {
		this.setPropertyValue("startAngle", value, true);
	}

	/**
	 * @return {number} Start angle (degrees)
	 */
	public get startAngle(): number {
		return this.getPropertyValue("startAngle");
	}

	/**
	 * Starting angle of the Radar face. (degrees)
	 *
	 * Normally, a circular radar face ends (the radial axis is drawn) exactly
	 * where it has started, forming a full 360 circle. (at 270 degrees)
	 *
	 * You can use `endAngle` to end the circle somewhere else.
	 *
	 * E.g. setting this to 180 will make the radar face end at horizontal line
	 * to the left off the center.
	 *
	 * For a perfect circle the absolute sum of `startAngle` and `endAngle`
	 * needs to be 360.
	 *
	 * However, it's **not** necessary to do so. You can set those to lesser
	 * numbers, to create semi-circles.
	 *
	 * E.g. `startAngle = -90` with `endAngle = 0` will create a radar face that
	 * looks like a quarter of a circle.
	 *
	 * @default -90
	 * @param {number}  value  End angle (degrees)
	 */
	public set endAngle(value: number) {
		this.setPropertyValue("endAngle", value, true);
	}

	/**
	 * @return {number} End angle (degrees)
	 */
	public get endAngle(): number {
		return this.getPropertyValue("endAngle");
	}

	/**
	 * Outer radius of the Radar face.
	 *
	 * This can either be in absolute pixel value, or relative [[Percent]].
	 *
	 * @param {number | Percent}  value  Outer radius
	 */
	public set radius(value: number | Percent) {
		this.setPropertyValue("radius", value, true);
	}

	/**
	 * @return {number} Outer radius
	 */
	public get radius(): number | Percent {
		return this.getPropertyValue("radius");
	}

	/**
	 * Inner radius of the Chord nodes.
	 *
	 * This can either be in absolute pixel value, or relative [[Percent]].
	 *
	 * @param {number | Percent}  value  Outer radius
	 */
	public set innerRadius(value: number | Percent) {
		this.setPropertyValue("innerRadius", value, true);
	}

	/**
	 * @return {number} Inner radius
	 */
	public get innerRadius(): number | Percent {
		return this.getPropertyValue("innerRadius");
	}



	/**
	 *
	 * If you set this to true, all the lines will be of the same width. This is done by making middleLine of a ChordLink visible.
	 *
	 * @param {boolean}  value
	 */
	public set nonRibbon(value: boolean) {
		this.setPropertyValue("nonRibbon", value, true);
		this.links.template.middleLine.strokeOpacity = 1;
		this.links.template.link.fillOpacity = 0;
	}

	/**
	 * @return {boolean} Non-ribbon
	 */
	public get nonRibbon(): boolean {
		return this.getPropertyValue("nonRibbon");
	}

	/**
	 * @ignore
	 */
	public createNode():this["_node"]{
		let node = new ChordNode();
		this._disposers.push(node);
		return node;
	}

	/**
	 * @ignore
	 */
	public createLink():this["_link"]{
		let link = new ChordLink();
		this._disposers.push(link);
		return link;
	}

}

/**
 * Register class in system, so that it can be instantiated using its name from
 * anywhere.
 *
 * @ignore
 */
registry.registeredClasses["ChordDiagram"] = ChordDiagram;
