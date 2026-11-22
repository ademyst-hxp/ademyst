<template>
	<svg
		viewBox="0 0 640 640"
		fill="none"
		xmlns="http://www.w3.org/2000/svg"
		xmlns:xlink="http://www.w3.org/1999/xlink"
	>
		<use xlink:href="#stroke0_4_15" fill="#FB1AFF" />
		<use xlink:href="#stroke0_4_15" fill="black" fill-opacity="0.2" />
		<use xlink:href="#stroke0_4_15" fill="black" fill-opacity="0.2" />
		<use xlink:href="#stroke1_4_15" fill="#FB1AFF" />
		<use xlink:href="#stroke1_4_15" fill="black" fill-opacity="0.2" />
		<use xlink:href="#stroke2_4_15" fill="#FB1AFF" />
		<use xlink:href="#stroke2_4_15" fill="black" fill-opacity="0.2" />
		<use xlink:href="#stroke3_4_15" fill="#FB1AFF" />
		<use
			xlink:href="#stroke3_4_15"
			fill="url(#paint0_linear_4_15)"
			fill-opacity="0.3"
		/>
		<path
			d="M265.679 150.294C295.404 120.569 343.596 120.569 373.321 150.294L494.021 270.999C523.746 300.724 523.746 348.919 494.021 378.644L373.321 499.349C343.596 529.074 295.404 529.074 265.679 499.349L144.979 378.644C115.254 348.919 115.254 300.724 144.979 270.999L265.679 150.294ZM346.41 178.092C331.548 163.229 307.452 163.229 292.59 178.092L172.775 297.91C157.913 312.773 157.913 336.87 172.775 351.733L292.59 471.551C307.452 486.414 331.548 486.414 346.41 471.551L466.225 351.733C481.087 336.87 481.087 312.773 466.225 297.91L346.41 178.092Z"
			fill-rule="evenodd"
			clip-rule="evenodd"
			fill="black"
			fill-opacity="0.1"
		/>
		<defs>
			<linearGradient
				id="paint0_linear_4_15"
				x1="91.1578"
				y1="96.4714"
				x2="543.1"
				y2="549.588"
				gradientUnits="userSpaceOnUse"
			>
				<stop stop-opacity="0" />
				<stop offset="1" />
			</linearGradient>
			<path
				id="stroke0_4_15"
				d="M206.518 253.462H432.482V515.113L333.02 633.228C325.365 642.318 311.344 642.246 303.783 633.077L206.518 515.113V253.462Z"
			/>
			<path
				id="stroke1_4_15"
				d="M96.6621 467.814C99.2701 452.166 106.702 437.723 117.92 426.505L255.279 289.142H374.207V408.074L236.848 545.438C225.63 556.655 211.188 564.088 195.54 566.696L103.164 582.093C90.285 584.239 79.1195 573.073 81.266 560.194L96.6621 467.814Z"
			/>
			<path
				id="stroke2_4_15"
				d="M542.338 467.814C539.73 452.166 532.298 437.723 521.08 426.505L383.721 289.142H264.793V408.074L402.152 545.438C413.369 556.655 427.812 564.088 443.46 566.696L535.836 582.093C548.715 584.239 559.88 573.073 557.734 560.194L542.338 467.814Z"
			/>
			<path
				id="stroke3_4_15"
				d="M494.021 270.999C523.746 300.724 523.746 348.919 494.021 378.644L373.321 499.349C343.596 529.074 295.404 529.074 265.679 499.349L144.979 378.644C115.254 348.919 115.254 300.724 144.979 270.999L265.679 150.294C295.404 120.569 343.596 120.569 373.321 150.294L494.021 270.999Z"
			/>
		</defs>
		<foreignObject x="235" y="240" width="170" height="170">
			<div xmlns="http://www.w3.org/1999/xhtml" class="quest-content">
				<slot />
			</div>
		</foreignObject>
	</svg>
</template>

<style scoped>
.quest-content {
	width: 100%;
	height: 100%;
	display: flex;
	align-items: center;
	justify-content: center;
	text-align: center;
	box-sizing: border-box;
	overflow: hidden;
	overflow-wrap: anywhere;
	font-size: 28px;
	line-height: 1.2;
	color: var(--quest-text, #fff);
}
</style>
