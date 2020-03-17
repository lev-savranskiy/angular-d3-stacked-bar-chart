import {Component, ElementRef, EventEmitter, Input, Output, OnInit, SimpleChanges} from '@angular/core';
import * as d3 from 'd3';

@Component({
    selector: 'app-d3-stacked-bar-chart',
    templateUrl: './d3-stacked-bar-chart.component.html',
    styleUrls: ['./d3-stacked-bar-chart.component.scss']
})

export class D3StackedBarChartComponent {
    @Input() data: any;
    @Input() options: any;
    @Input() max: number;
    @Output() sendDataToParent = new EventEmitter<object>();

    private x0: any;
    private x1: any;
    private y: any;
    private z: any;
    private svg: any;
    private keys: any;
    private chart: any;
    private barGroups: any;
    private rectGroup: any;
    private keysLen: number;
    private dataLen: number;
    private margin: number;
    private width: number;
    private height: number;
    private ticksCount: number;
    private colors = ['#0B7DBB', '#FFA500', '#ff0000', '#5899DA', '#945ECF', '#13A4B4',
        '#525DF4', '#BF399E', '#6C8893', '#EE6868', '#2F6497'];


    constructor(private eltRef: ElementRef) {
    }

    ngOnInit() {
        const defaultOptions = {
            mode: 'stack',
            textx: '',
            texty: '',
            width: 1000,
            height: 600
        };
        this.options = {...defaultOptions, ...this.options};
    }

    ngOnChanges(changes: SimpleChanges) {

        this.svg = d3.select(this.eltRef.nativeElement).select('.chart');
        this.svg.selectAll('*').remove();

        if (!this.max || !this.data || !this.data[0]) {
            return;
        }

        if (this.options && this.options.mode && !this[this.options.mode]) {
            throw new Error(`Cant find mode ${this.options.mode}`);
        } else {

            this.margin = 60;
            this.width = this.options.width - 2 * this.margin;
            this.height = this.options.height - 2 * this.margin;
            // make ticks every 40 px
            this.ticksCount = this.height / 40;

            this.chart = this.svg.append('g')
                .attr('transform', `translate(${this.margin}, ${this.margin})`);

            if (!this.options.texty) {
                this.options.texty = this.keys[0];
            }

            // now  this.max required
            // todo  case with no max passed
            // const max = this.max > 0 ? this.max : d3.max(this.data, (d) => d.maxDuration);
            this.keys = Object.keys(this.data[0]).filter(k => k !== 'key');
            this.keysLen = this.keys.length;
            this.dataLen = this.data.length;
            // const colors = this.colors.slice(0, keysLen);
            this.x0 = d3.scaleBand()
                .rangeRound([0, this.width])
                .paddingInner(0.3);

            this.x1 = d3.scaleBand()
                .padding(0.05);

            this.y = d3.scaleLinear()
                .rangeRound([this.height, 0]);

            this.z = d3.scaleOrdinal()
                .range(this.colors);

            this[this.options.mode]();
            this.axes();
        }

    }

    hasObserver() {
        return this.sendDataToParent.observers && this.sendDataToParent.observers.length;
    }

    private group() {
        let cnt = 0;
        const sendDataToParent = this.sendDataToParent;
        this.x0.domain(this.data.map(function (d) {
            return d.key;
        }));
        this.x1.domain(this.keys).rangeRound([0, this.x0.bandwidth()]);
        this.y.domain([0, d3.max(this.data, (d) => d3.max(this.keys, function (key) {
            return d[key];
        }))]).nice();

        this.rectGroup = this.svg.append('g')
            .attr('transform', `translate(${this.margin},${this.margin})`).append('g')
            .selectAll('g')
            .data(this.data)
            .enter()
            .append('g')
            .attr('transform', (d) => `translate(${this.x0(d.key)},0)`)
            .selectAll('rect')
            .data((d) => this.keys.map(function (key) {
                return {key: key, value: d[key], gkey: d.key};
            }))
            .enter();

        this.barGroups = this.rectGroup.append('rect')
            .attr('x', (d) => this.x1(d.key))
            .attr('y', (d) => this.y(d.value))
            .attr('width', this.x1.bandwidth())
            .attr('height', (d) => this.height - this.y(d.value))
            .attr('fill', (d) => this.z(d.key))
            .on('click', function(d)  {
                const  data = {};
                data['key'] = d.gkey;
                data[d.key] = d.value;
                sendDataToParent.emit(data);
            });


        this.rectGroup.append('text')
            .text(function (d) {
                return d.value;
            })
            .attr('font-size', this.x0.bandwidth() / (this.keysLen * 2) + 'px')
            .attr('font-weight', 'bold')
            .attr('text-anchor', 'middle')
            .style('fill', (d) => {
                return this.z(d.key);
            })
            .attr('x', (d, i) => {
                return this.x1(d.key) + this.x1.bandwidth() / 2;
            })
            .attr('y', (d) => {
                return this.y(d.value) - 3;
            });


    }

    private stack() {
        let cnt = 0, keyPos = 0;

        this.x0.domain(this.data.map((d: any) => d.key));
        this.y.domain([0, this.max]).nice();
        this.z.domain(this.keys);

        this.rectGroup = this.chart.append('g')
            .selectAll('g')
            .data(d3.stack().keys(this.keys)(this.data))
            .enter().append('g')
            .attr('fill', d => this.z(d.key))
            .selectAll('rect')
            .data(d => d)
            .enter();


        const sendDataToParent = this.sendDataToParent;

        this.barGroups = this.rectGroup.append('rect')
            .attr('x', d => this.x0(d.data.key))
            .attr('y', d => this.y(d[1]))
            .attr('keyval', d => {
                cnt++;
                const key = this.keys[keyPos];
                if ((cnt % this.dataLen) === 0) {
                    keyPos++;
                }
                return key;
            })
            .attr('height', d => this.y(d[0]) - this.y(d[1]))
            .attr('width', this.x0.bandwidth())
            .on('click', function(d)  {
                const keyval = d3.select(this).attr('keyval');
                let  data = {};
                if (d.data[keyval]) {
                    data['key'] = d.data.key;
                    data[keyval] = d.data[keyval];
                } else {
                    data = d.data;
                }

                sendDataToParent.emit(data);
            });


        this.barGroups
            .append('title')
            .text(function(d) {
                const keyval = d3.select(this.parentNode).attr('keyval');
                return `${keyval}: ${d.data[keyval]}`;
            });

        // add value as text for single bars
        if (this.keysLen === 1) {
            this.rectGroup.append('text')
                .text(function (d) {
                    return d[1];
                })
                .attr('font-size', this.x0.bandwidth() / 4 + 'px')
                .attr('font-weight', 'bold')
                .attr('text-anchor', 'middle')
                .attr('x', (d, i) => {
                    return this.x0(d.data.key) + this.x0.bandwidth() / 2;
                })
                .attr('y', (d) => {
                    return this.y(d[1]) - 3;
                });
        }
    }

    axes() {

        /***
         * cursor and mouseover
         */
        this.barGroups
            .style('cursor', this.hasObserver() ? 'pointer' : 'default')
            .on('mouseover', function (d) {
                d3.select(this)
                    .transition()
                    .duration(200)
                    .style('opacity', 0.75);
            })
            .on('mouseout', function (d) {
                d3.select(this)
                    .transition()
                    .duration(200)
                    .style('opacity', 1);
            });


        /***
         * axes
         */
        this.chart.append('g')
            .attr('class', 'axis')
            .attr('transform', `translate(0,${this.height})`)
            .call(d3.axisBottom(this.x0))
            .selectAll('text')
            .style('text-anchor', 'end')
            .attr('transform', 'rotate(-15)');

        this.chart.append('g')
            .attr('class', 'axis')
            .call(d3.axisLeft(this.y).ticks(this.ticksCount));


        this.svg.append('text')
            .attr('x', this.width + this.margin)
            .attr('y', this.height + this.margin * 1.5)
            .attr('text-anchor', 'middle')
            .text(this.options.textx);

        this.svg.append('text')
            .attr('x', this.margin * 1.5)
            .attr('y', this.margin / 1.5)
            .attr('text-anchor', 'middle')
            .text(this.options.texty);


        /***
         * legend
         */
        if (this.keysLen > 1) {
            const legendDimension = 19;
            const legend = this.svg.append('g')
                .attr('font-size', 10)
                .attr('text-anchor', 'end')
                .attr('transform', (d, i) => `translate(${this.margin}, ${this.margin / 3})`)
                .selectAll('g')
                .data(this.keys.slice().reverse())
                .enter().append('g')
                .attr('transform', (d, i) => `translate(0, ${i * (legendDimension + 1)})`);

            legend.append('rect')
                .attr('x', this.width - legendDimension)
                .attr('width', legendDimension)
                .attr('height', legendDimension)
                .attr('fill', this.z);

            legend.append('text')
                .attr('x', this.width - 24)
                .attr('y', legendDimension / 2)
                .attr('dy', '0.32em')
                .text(d => d);
        }
    }

}
