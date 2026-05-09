<script>
  export let colname = {"string":"Column1","number":"0"};
  export let rowdata = [["String1","1"],["String2","2"]];
  export let url;
  export let click;
  let datatypelist = [];
  let enterdatatypes = () => {
    datatypelist = [];
    Object.keys(colname).forEach(function (key) {
      datatypelist.push(key);
    });
  };
  window.onload = enterdatatypes();
  console.log(datatypelist, "This is list of datatypes in table");
  let returndatatype = (key, value) => {
    return key == "string"
      ? "<p>" + value + "</p>"
      : key == "number"
      ? parseInt(value)
      : key == "input"
      ? "<input type='text' value=" +
        "'" +
        value +
        "'" +
        " class='border px-3 py-2 shadow-inner'/>"
      : key == "date"
      ? "<input type='date' value=" +
        value +
        " class='border px-3 py-2 shadow-inner'/>"
      : key == "time"
      ? "<input value=" +
        value +
        " class='border px-3 py-2 shadow-inner' type='time'/>"
      : key == "mail"
      ? "<a href=" +
        "mailto:" +
        value +
        " class='text-blue-400' >" +
        "<span>&#9993;</span> " +
        value +
        "</a>"
      : key == "phone"
      ? "<a href=" +
        "tel:" +
        value +
        " class='text-blue-400' >" +
        "<span>&#9742;</span> " +
        value +
        "</a>"
      : key == "dropdown"
      ? typeof value == "object"
        ? (
            "<select class='border px-3 py-2 shadow-inner'>" +
            value.map((element) => {
              return "<option>" + element + "</option>";
            }) +
            "</select>"
          ).replace(",", "")
        : (
            "<select class='border px-3 py-2 shadow-inner'>" +
            [value].map((element) => {
              return "<option>" + element + "</option>";
            }) +
            "</select>"
          ).replace(",", "")
      : key == "checkbox"
      ? "<input " + value + " type='checkbox' />"
      : key == "list"
      ? typeof value == "object"
        ? (
            "<ul>" +
            value
              .map((element) => {
                return (
                  "<li>" +
                  "<span>&#8640;</span> " +
                  element +
                  "</li>"
                ).toString();
              })
              .toString() +
            "</ul>"
          ).replace(",", "")
        : (
            "<ul>" +
            [value]
              .map((element) => {
                return (
                  "<li>" +
                  "<span>&#8640;</span> " +
                  element +
                  "</li>"
                ).toString();
              })
              .toString() +
            "</ul>"
          ).replace(",", "")
      : key == "image"
      ? "<img alt='' src=" +
        value +
        " class='w-10 rounded shadow' style='max-width:none;' />"
      : key == "html"
      ? value
      : key == "code"
      ? "<code class='filter contrast-200 bg-gray-700 text-green-500 rounded shadow-inner border px-3 py-2'>" +
        value +
        "</code>"
      : key == "tag"
      ? value.includes("#")
        ? "<code class='bg-blue-100 text-blue-500 rounded-full shadow border-blue-500 border-2 px-3 py-2'>" +
          value +
          "</code>"
        : value.includes("@")
        ? "<code class='bg-yellow-100 text-yellow-500 rounded-full shadow border-yellow-500 border-2 px-3 py-2'>" +
          value +
          "</code>"
        : "<code class='bg-red-100 text-red-500 rounded-full shadow border-red-500 border-2 px-3 py-2'>" +
          value +
          "</code>"
      : key == "url"
      ? "<a href=" + value + " class='text-blue-400' >" + "🌐 " + value + "</a>"
      : "";
  };
</script>

<svelte:head>
  <link
    href="https://unpkg.com/tailwindcss@^2/dist/tailwind.min.css"
    rel="stylesheet"
  />
</svelte:head>
<div class="flex flex-col rounded ">
  <div class="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8 rounded ">
    <div
      class="rounded py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8 "
    >
      <div class="rounded border">
        <table class="min-w-full rounded">
          <thead class="rounded shadow-inner bg-gray-100">
            <tr class="rounded p-2">
              {#each datatypelist as dt, indexj}
                <th scope="col" class="shadow w-max px-4 py-3">
                  <div class="space-x-10 w-max">
                    <div
                      class="inline-block text-sm leading-5 font-bold  text-left text-gray-700 tracking-wider"
                    >
                      {@html colname[dt]}
                    </div>
                    <div
                      class="inline-block border-green-500 border-2 shadow-inner mx-3 px-3 rounded-full text-green"
                    >
                      <select
                        class="text-green-500 w-min"
                        bind:value={datatypelist[indexj]}
                      >
                        <option value="string" class="text-green-500"
                          >string</option
                        >
                        <option value="number" class="text-green-500"
                          >number</option
                        >
                        <option value="image" class="text-green-500"
                          >image</option
                        >
                        <option value="dropdown" class="text-green-500"
                          >dropdown</option
                        >
                        <option value="list" class="text-green-500">list</option
                        >
                        <option value="checkbox" class="text-green-500"
                          >checkbox</option
                        >
                        <option value="date" class="text-green-500">date</option
                        >
                        <option value="time" class="text-green-500">time</option
                        >
                        <option value="input" class="text-green-500"
                          >input</option
                        >
                        <option value="code" class="text-green-500">code</option
                        >
                        <option value="html" class="text-green-500">html</option
                        >
                        <option value="url" class="text-green-500">url</option>
                        <option value="tag" class="text-green-500">tag</option>
                        <option value="phone" class="text-green-500"
                          >phone</option
                        >
                        <option value="mail" class="text-green-500">mail</option
                        >
                      </select>
                    </div>
                  </div></th
                >
              {/each}
            </tr>
          </thead>
          <tbody class="rounded  text-sm leading-5 font-normal">
            {#each rowdata as i, index}
              <tr class="shadow">
                {#each i as j, indexj}
                  <td class="shadow">
                    <div>
                      <a href={url}>
                        <div class="px-6 py-4 w-max my-auto">
                          <div
                            class="cursor-pointer text-center text-sm leading-5 font-normal text-left whitespace-nowrap text-gray-700"
                            on:click={click}
                          >
                            {@html returndatatype(datatypelist[indexj], j)}
                          </div>
                        </div></a
                      >
                    </div>
                  </td>
                {/each}
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>
  </div>
</div>

<style>
  select {
    background-color: transparent !important;
  }
</style>
