<h1 align="center">
  <table><tr><th><img width=100% src="https://user-images.githubusercontent.com/56549294/125154417-94477180-e177-11eb-8772-0167bdd7d3b4.png" alt="Svelte-Tailwind-Table"/></th></tr><tr><th><br><br><span class="badge-npmdownloads"><a href="https://npmjs.org/package/svelte-tables-tailwind" title="View this project on NPM"><img width=70% src="https://img.shields.io/npm/dm/svelte-tables-tailwind.svg" alt="NPM downloads" /></a></span><br><br><hr>


```
npm i svelte-tables-tailwind
```


<hr><br><br><a href="https://www.npmjs.com/package/svelte-tables-tailwind"><img width=50% src="https://user-images.githubusercontent.com/56549294/125153433-49c2f680-e171-11eb-93ec-7e0fba7703a8.png" alt="npm"/></a><br><br></th></tr><tr><td><img width=100% src="https://user-images.githubusercontent.com/56549294/125154425-a2958d80-e177-11eb-8741-68707caf8156.png" alt="Svelte-Tailwind-Table"/></td></tr>
</table>
<br>
<br>
<br>
  <hr>
<br>
<br>
<br>

  <h1 align="center">Data Types in which the given data can be rendered or changed:</h1>

<br>
<br><div align="center">


|||DATA TYPES|||
|---|---|---|---|---|
|✅Checkbox|✍️Input|🔤String|🌐URL|✉️Mail|
|☎️Phone|[ , ] list|🖼Image|🔽Dropdown|🔢Number|
|⌨Code|<span><</span>HTML/>|🗓Date|🕘Time|🏷Tag|


<br>
<br>
<br>
  <hr>
<br>
<br>
<br>
  
  
  
https://user-images.githubusercontent.com/56549294/126066556-8485e044-760b-4239-aec6-eed5aca3f3a6.mov
  


<br>
<br>
<br>
  <hr>
<br>
<br>
<br>
  <h1 align="center">Props</h1>

<br>
<br><div align="center">


|Prop|About|Default Value|Formal|
|---|---|---|---|
|colname|JSON of Headers of Table with dataTypes as Keys|{ "string" : "Column1" , "number" : "0" }|{ "DataType" : "Header" , ...}|
|rowdata|List of Lists of row's Data of Table|[ [ "String1" , "1" ] , [ "String2" , "2" ] ]|[ [] , ... ]|
|url|Link to Redirect when Clicked on Table Data|NA|String|
|click|Call a Function when Clicked on Table Data|NA|() => {}|



<br>
<br>
<br>
  <hr>
<br>
<br>
<br>


  
  
  <h1 align="center">Steps To Use thus Plugin:</h1>
  </div>
  <br>
  </div>
<ul>
<li><h3> 1. Import Tailwind via CDN</h3> <br>


```html
<!-- index.html file -->
<link href="https://unpkg.com/tailwindcss@^2/dist/tailwind.min.css" rel="stylesheet">
```

</li>
  <br>
<li><h3> 2. Install</h3> <br>


```bash
npm i svelte-tailwind-table
```

</li>
<br>

<li><h3> 3. Import</h3> <br>


```javascript
// in .js file where you want to use this component
import Tables from "svelte-tailwind-table";
```

</li>
  <br>
<li><h3> 4. Using Component</h3> <br>

```javascript
// in the same.js file where you want to use this component outside <script></script> tag
<Tables

// Headers Row
  colname={{
    checkbox: "Checkbox",
    input: "Input",
    string: "String",
    url: "URL",
    mail: "Mail",
    phone: "Phone",
    list: "List",
    image: "Image",
    dropdown: "DropDown",
    number: "Number",
    code: "Code",
    html: "HTML",
    date: "Date",
    time: "Time",
    tag: "Tag",
  }}
  rowdata={[
// 1st Content Row
    [
    "checked",
    "This is Input",
    "String",
    "URL",
    "you@example.com",
    "+911234567890",
    ["Item1", "Item2"],
    "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
    ["Option1", "Option2"],
    "1",
    "this is Code",
    "<div>HTML Hr tag</div><hr/>",
    "2020-09-09",
    "09:21:45",
    "#tag",
    ],
// For more Rows Keep on providing list similar to 1st Content Row
  ]}
/>
```

</li>
  </ul>
<br>
<br>
<br>
  <hr>
<br>
<br>
<br>

<h1 align="center">


```diff
+ Developed with ❤️ by Arshdeep Singh
```

</h1>
