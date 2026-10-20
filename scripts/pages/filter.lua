-- What the pages add to pandoc's HTML: a permalink on every heading, and the
-- requirement keywords set apart, as RFC 2119 reads them.
local keywords = {
  MUST = true, ["MUST NOT"] = true, SHOULD = true, ["SHOULD NOT"] = true,
  MAY = true, REQUIRED = true, OPTIONAL = true,
}

function Header(h)
  if h.identifier ~= "" then
    h.content:insert(pandoc.Space())
    h.content:insert(pandoc.Link({ pandoc.Str("§") }, "#" .. h.identifier, "",
      { class = "here", ["aria-label"] = "Link to this section" }))
  end
  return h
end

function Inlines(inlines)
  local out = pandoc.List()
  local i = 1
  while i <= #inlines do
    local el = inlines[i]
    if el.t == "Str" and (el.text == "MUST" or el.text == "SHOULD")
      and inlines[i + 1] and inlines[i + 1].t == "Space"
      and inlines[i + 2] and inlines[i + 2].t == "Str"
      and inlines[i + 2].text:match("^NOT") then
      local rest = inlines[i + 2].text:sub(4)
      out:insert(pandoc.Span({ pandoc.Str(el.text .. " NOT") }, { class = "rfc" }))
      if rest ~= "" then out:insert(pandoc.Str(rest)) end
      i = i + 3
    elseif el.t == "Str" then
      local word, rest = el.text:match("^(%u+)(.*)$")
      if word and keywords[word] then
        out:insert(pandoc.Span({ pandoc.Str(word) }, { class = "rfc" }))
        if rest ~= "" then out:insert(pandoc.Str(rest)) end
      else
        out:insert(el)
      end
      i = i + 1
    else
      out:insert(el)
      i = i + 1
    end
  end
  return out
end
