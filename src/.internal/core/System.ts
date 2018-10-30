﻿/**
 * ============================================================================
 * IMPORTS
 * ============================================================================
 * @hidden
 */
import { registry } from "./Registry";
import { Sprite } from "./Sprite";
import { Container } from "./Container";
import { svgContainers, SVGContainer } from "./rendering/SVGContainer";
import { Component } from "./Component";
import { options } from "./Options";
import { Paper } from "./rendering/Paper";
import { raf } from "./utils/AsyncPending";
import { animations } from "./utils/Animation";
import { triggerIdle } from "./utils/AsyncPending";
import * as $dom from "./utils/DOM";
import * as $array from "./utils/Array";
import * as $type from "./utils/Type";


/**
 * ============================================================================
 * MAIN CLASS
 * ============================================================================
 * @hidden
 */

/**
 * The main class that handles system-wide tasks, like caching, heartbeats, etc.
 * @important
 */
export class System {

	/**
	 * Unique ID of the object.
	 *
	 * @type {string}
	 */
	public uid: string = registry.getUniqueId();

	/**
	 * amCharts Version.
	 *
	 * This follows npm's semver specification.
	 *
	 * @see {@link https://docs.npmjs.com/misc/semver}
	 * @type {string}
	 */
	static VERSION: string = "4.0.0-beta.63";

	/**
	 * @todo Description
	 * @todo Needed?
	 * @ignore Exclude from docs
	 * @type {number}
	 */
	public dummyCounter: number = 0;

	/**
	 * @todo Description
	 * @ignore Exclude from docs
	 * @type {number}
	 */
	public time: number;


	protected _frameRequested: boolean = false;

	protected _updateStepDuration:number = 50;

	/**
	 * Performs initialization of the System object.
	 *
	 * Called when the first [[Sprite]] object is created.
	 *
	 * @ignore Exclude from docs
	 */
	public constructor() {
		this.time = Date.now();
	}

	/**
	 * Reports time elapsed since timer was reset.
	 *
	 * @ignore Exclude from docs
	 * @todo Needed?
	 * @param {string}   msg    Message to report in console
	 * @param {boolean}  reset  Reset time counter
	 */
	public reportTime(msg: string, reset?: boolean): void {
		if (this.dummyCounter < 6) {
			//console.log(Date.now() - this.time, msg, this.dummyCounter2);
		}
		if (reset) {
			this.time = Date.now();
		}
	}

	/**
	 * Performs "heartbeat" operations `frameRate` number of times per second.
	 *
	 * When the chart element is invalidated, it is not immediately redrawn.
	 *
	 * Instead it waits for the next `update()` cycle to be re-validated.
	 *
	 * @ignore Exclude from docs
	 * @todo Maybe should be private?
	 */
	public update(): void {

		this._frameRequested = false;	

		let time = Date.now();	

		registry.dispatchImmediately("enterframe");

		//this.validateLayouts();
		//this.validatePositions();

		let skippedComponents: Component[] = [];

		// data objects first - do all calculations
		// only data is parsed in chunks, thats why we do for loop instead of a while like with other invalid items.
		// important to go backwards, as items are removed!
		// TODO use iterator instead
		while (registry.invalidDatas.length > 0) {
			let component: Component = registry.invalidDatas[0];
			let dataProvider: $type.Optional<Component> = component.dataProvider;

			if (!component.isDisposed()) {		

				if (dataProvider && dataProvider.dataInvalid) {
					try {
						dataProvider.validateData();
						if (dataProvider.dataValidationProgress < 1) {
							break;
						}
					}
					catch (e) {
						$array.remove(registry.invalidDatas, dataProvider);
						dataProvider.raiseCriticalError(e);
					}
				}
				else {
					try {
						component.validateData();
						if (component.dataValidationProgress < 1) {
							break;
						}
					}
					catch (e) {
						$array.remove(registry.invalidDatas, component);
						component.raiseCriticalError(e);
					}
				}
			}
			else {
				$array.remove(registry.invalidDatas, component);
			}

			if(Date.now() - time > this._updateStepDuration){
				skippedComponents = registry.invalidDatas;
				break;
			}			
		}

		while (registry.invalidRawDatas.length > 0) {
			let component: Component = registry.invalidRawDatas[0];
			if (!component.isDisposed()) {
				try {
					component.validateRawData();
				}
				catch (e) {
					$array.remove(registry.invalidRawDatas, component);
					component.raiseCriticalError(e);
				}
			}
			else {
				$array.remove(registry.invalidRawDatas, component);
			}
		}

		// TODO use iterator instead
		while (registry.invalidDataItems.length > 0) {
			let component: Component = registry.invalidDataItems[0];

			let dataProvider: $type.Optional<Component> = component.dataProvider;

			// this is needed to avoid partial value validation when data is parsed in chunks
			if (component.isDisposed() || component.dataInvalid || (dataProvider && dataProvider.dataInvalid)) {
				// void
			}
			else {
				try {
					component.validateDataItems();
				}
				catch (e) {
					$array.remove(registry.invalidDataItems, component);
					component.raiseCriticalError(e);
				}
			}

			// this might seem too much, as validateValues removes from invalidDataItems aswell, but just to be sure (in case validateData is overriden and no super is called)
			$array.remove(registry.invalidDataItems, component);
		}

		// TODO use iterator instead
		while (registry.invalidDataRange.length > 0) {
			let component: Component = registry.invalidDataRange[0];

			let dataProvider: $type.Optional<Component> = component.dataProvider;

			if (component.isDisposed() || component.dataInvalid || (dataProvider && dataProvider.dataInvalid)) {
				// void
			}
			else {
				try {
					component.validateDataRange();
					if (!component.skipRangeEvent) {
						component.dispatchImmediately("datarangechanged");
					}
					component.skipRangeEvent = false;
				}
				catch (e) {
					$array.remove(registry.invalidDataRange, component);
					component.raiseCriticalError(e);
				}
			}
			// this might seem too much, as validateDataRange removes from invalidDataRange aswell, but just to be sure (in case validateData is overriden and no super is called)
			$array.remove(registry.invalidDataRange, component);
		}

		let skippedSprites: Sprite[] = [];

		// display objects later
		// TODO use iterator instead

		for(let key in registry.invalidLayouts){
			this.validateLayouts(key);
		}
		for(let key in registry.invalidPositions){
			this.validatePositions(key);
		}


		let hasSkipped:boolean = false;

		time = Date.now();

		for(var key in registry.invalidSprites){
			let count = 0;
			
			let invalidSprites = registry.invalidSprites[key];

			while (invalidSprites.length > 0) {
				this.validateLayouts(key);
				this.validatePositions(key);

				count++;

				if(count == 5){
					if(Date.now() - time > this._updateStepDuration){
						skippedSprites = invalidSprites;
						break;
					}
					count = 0;
				}

				let sprite: Sprite = invalidSprites[invalidSprites.length - 1];

				// we need to check this, as validateLayout might validate sprite
				if (sprite && !sprite.isDisposed()) {
					if (sprite instanceof Component && (sprite.dataInvalid || (sprite.dataProvider && sprite.dataProvider.dataInvalid))) {
						// void
						skippedSprites.push(sprite);
					}
					else {
						if (sprite.dataItem && sprite.dataItem.component && sprite.dataItem.component.dataInvalid && !sprite.dataItem.component.isTemplate) {
							// void
							skippedSprites.push(sprite);
						}
						else {
							try {
								if (sprite instanceof Container) {
									sprite.children.each((child) => {									
										if (child.invalid) {
											if (child instanceof Component && (child.dataInvalid || (child.dataProvider && child.dataProvider.dataInvalid))) {
												skippedSprites.push(child);
											}
											else if (child.dataItem && child.dataItem.component && child.dataItem.component.dataInvalid) {
												skippedSprites.push(child);
											}
											else {
												child.validate();
											}
										}
									})
								}
								sprite.validate();
							}
							catch (e) {
								sprite.invalid = false;
								$array.remove(invalidSprites, sprite);
								sprite.raiseCriticalError(e);
							}
						}
					}
					// this might seem too much, but it's ok
					sprite.invalid = false;
				}
				$array.remove(invalidSprites, sprite);
			}

			if(Date.now() - time > this._updateStepDuration){
				skippedSprites = invalidSprites;
				break;
			}
		}

		for(var key in registry.invalidSprites){
			if(registry.invalidSprites[key].length > 0){
				hasSkipped = true;
			}
		}

		if(skippedComponents.length > 0){
			registry.invalidDatas = skippedComponents;
		}

		// TODO make this more efficient
		// TODO don't copy the array
		$array.each($array.copy(animations), (x) => {
			x.update();
		});

		// to avoid flicker, we validate positions last time
		//this.validateLayouts();
		//this.validatePositions();
		//if(!hasSkipped){
		for(let key in registry.invalidLayouts){
			this.validateLayouts(key);
		}
		for(let key in registry.invalidPositions){
			this.validatePositions(key);
		}
		//}

		triggerIdle();

		// to avoid flicker, we validate positions last time
		//this.validateLayouts();
		//this.validatePositions();

		registry.dispatchImmediately("exitframe");

		if (hasSkipped || animations.length > 0 || skippedComponents.length > 0) {
			this.requestFrame();
		}

		if(skippedSprites.length == 0){
			this._updateStepDuration = 250;
		}
	}

	requestFrame() {
		if (!this._frameRequested) {
			raf(() => {
				this.update();
			});
			this._frameRequested = true;
		}
	}

	/**
	 * Triggers position re-validation on all [[Sprite]] elements that have
	 * invalid(ated) positions.
	 *
	 * @ignore Exclude from docs
	 * @todo Maybe should be private?
	 */
	public validatePositions(id:string): void {
		// invalid positions
		// TODO use iterator instead
		let invalidPositions = registry.invalidPositions[id];

		while (invalidPositions.length > 0) {
			let sprite: Sprite = invalidPositions[invalidPositions.length - 1];
			if (!sprite.isDisposed()) {
				try {
					if (sprite instanceof Container) {
						sprite.children.each((sprite) => {
							if (sprite.positionInvalid) {
								sprite.validatePosition();
							}
						})
					}

					sprite.validatePosition();
				}
				catch (e) {
					sprite.positionInvalid = false;
					$array.remove(invalidPositions, sprite);
					sprite.raiseCriticalError(e);
				}
			}
			else {
				$array.remove(invalidPositions, sprite);
			}
		}
	}

	/**
	 * Triggers position re-validation on all [[Container]] elements that have
	 * invalid(ated) layouts.
	 *
	 * @ignore Exclude from docs
	 * @todo Maybe should be private?
	 */
	public validateLayouts(id:string): void {
		// invalid positions
		// TODO use iterator instead
		let invalidLayouts = registry.invalidLayouts[id];
		while (invalidLayouts.length > 0) {
			let container: Container = invalidLayouts[invalidLayouts.length - 1];
			if (!container.isDisposed()) {
				try {
					container.children.each((sprite) => {
						if (sprite instanceof Container && sprite.layoutInvalid && !sprite.isDisposed()) {
							sprite.validateLayout();
						}
					})

					container.validateLayout();
				}
				catch (e) {
					container.layoutInvalid = false;
					$array.remove(invalidLayouts, container);
					container.raiseCriticalError(e);
				}
			}
			else {
				$array.remove(invalidLayouts, container);
			}
		}
	}

	/**
	 * Outputs string to console if `verbose` is `true`.
	 *
	 * @param {any} value Message to output to console
	 */
	public log(value: any): void {
		if (options.verbose) {
			if (console) {
				console.log(value);
			}
		}
	}

	/**
	 * Get current theme
	 * @return {ITheme} [description]
	 */
	/*public get theme(): ITheme {
		return $array.last(this.themes);
	}*/

	/**
	 * Number of times per second charts will be updated.
	 *
	 * This means that each time an element is invalidated it will wait for the
	 * next cycle to be re-validated, and possibly redrawn.
	 *
	 * This happens every `1000 / frameRate` milliseconds.
	 *
	 * Reducing this number may reduce the load on the CPU, but might slightly
	 * reduce smoothness of the animations.
	 *
	 * @type {number} Frame rate
	 */
	public set frameRate(value: number) {
		registry.frameRate = value;
	}

	/**
	 * @return {number} Frame rate
	 */
	public get frameRate(): number {
		return registry.frameRate;
	}
}


/**
 * A singleton global instance of [[System]].
 *
 * All code should use this, rather than instantiating their
 * own System objects.
 */
export const system: System = new System();
