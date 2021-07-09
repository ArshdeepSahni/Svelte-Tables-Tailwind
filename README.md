<h1 align="center">
  <table><tr><th><img width=100% src="https://user-images.githubusercontent.com/56549294/124975713-eb502800-e04b-11eb-98b0-03ababedf474.png" alt="Svelte-Tailwind-Table"/></th></tr><tr><td><img width=100% src="https://user-images.githubusercontent.com/56549294/124974079-01f57f80-e04a-11eb-98fc-b9d3944053d5.png" alt="Svelte-Tailwind-Table"/></td></tr></table>
<br>
<br>
<br>
<br>

```Data Types in which the given data can be rendered or changed:```


<br>


|||DATA TYPES|||
|---|---|---|---|---|
|✅Checkbox|✍️Input|🔤String|🌐URL|✉️Mail|
|☎️Phone|[ , ] list|🖼Image|🔽Dropdown|🔢Number|
|⌨Code|<span><</span>HTML/>|🗓Date|🕘Time|🏷Tag|


<br>
<br>
<br>
<br>
  <code align="center">Steps To Use thus Plugin:</code>
  </h1>
  <br>
<ul>
<li><h1> 1. Import Tailwind via CDN</h1> <br>


```html
<!-- index.html file -->
<link href="https://unpkg.com/tailwindcss@^2/dist/tailwind.min.css" rel="stylesheet">
```

</li>
<li><h1> 2. Install</h1> <br>


```bash
npm i svelte-tailwind-table
```

</li>
<br>

<li><h1> 3. Import</h1> <br>


```javascript
// in .js file where you want to use this component
import Tables from "svelte-tailwind-table";
```

</li>
  <br>
<li><h1> 4. Using Component</h1> <br>

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
<br>

<h1 align="center">


```diff
+ Developed with ❤️ by Arshdeep Singh
```

</h1>